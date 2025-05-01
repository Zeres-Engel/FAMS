import os
import numpy as np
import torch
from torch.utils.data import DataLoader, TensorDataset
from sklearn import metrics
from sklearn.metrics import auc
from sklearn.model_selection import KFold
from tqdm import tqdm
import pickle
import cv2

class EvalMetric:
    def __init__(self, val_loader, valid_path, device, thresholds=np.arange(0, 1, 0.01)):
        self.val_loader = val_loader
        self.device = device
        self.thresholds = thresholds

    def eval(self, model):
        model = model.to(self.device)
        model.eval()
        embeddings, labels = self.extract_embeddings_val(model)
        distance_matrix = self.find_cosine_distance_matrix(embeddings)
        threshold_correct_counters_strategy = self.strategy(labels, distance_matrix)
        max_acc, max_precision, max_recall, max_selectivity, auc_val = self.summary_results(threshold_correct_counters_strategy)
        return max_acc, max_precision, max_recall, max_selectivity, auc_val

    def extract_embeddings_val(self, model):
        embeddings = []
        labels = []
        with torch.no_grad():
            for img, local_labels in tqdm(self.val_loader, desc="Extracting embeddings"):
                img = img.to(self.device)
                local_embeddings = model(img)
                if isinstance(local_embeddings, tuple):
                    local_embeddings = local_embeddings[0]
                embeddings.append(local_embeddings.cpu().numpy())
                labels.append(local_labels.cpu().numpy())
        embeddings = np.vstack(embeddings)
        labels = np.concatenate(labels)
        return embeddings, labels

    def find_cosine_distance_matrix(self, embeddings, batch_size=1000):
        try:
            embeddings = torch.tensor(embeddings, dtype=torch.float16).cuda()
            n = embeddings.size(0)
            normalized_embeddings = embeddings / embeddings.norm(dim=1, keepdim=True)
            cosine_distance_matrix = torch.zeros((n, n), dtype=torch.float16).cuda()

            for i in tqdm(range(0, n, batch_size), desc="Calculating cosine distance matrix (GPU)"):
                for j in range(0, n, batch_size):
                    batch1 = normalized_embeddings[i:i+batch_size]
                    batch2 = normalized_embeddings[j:j+batch_size]
                    cosine_similarity_matrix = torch.mm(batch1, batch2.T)
                    cosine_distance_matrix[i:i+batch_size, j:j+batch_size] = 1 - cosine_similarity_matrix

            cosine_distance_matrix.fill_diagonal_(0)
            return cosine_distance_matrix.cpu().numpy()
        except RuntimeError as e:
            return self.find_cosine_distance_matrix_cpu(embeddings, batch_size)

    def find_cosine_distance_matrix_cpu(self, embeddings, batch_size=1000):
        embeddings = np.array(embeddings)
        n = embeddings.shape[0]
        normalized_embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
        cosine_distance_matrix = np.zeros((n, n), dtype=np.float16)
        for i in range(0, n, batch_size):
            for j in range(0, n, batch_size):
                batch1 = normalized_embeddings[i:i+batch_size]
                batch2 = normalized_embeddings[j:j+batch_size]
                cosine_similarity_matrix = np.dot(batch1, batch2.T)
                cosine_distance_matrix[i:i+batch_size, j:j+batch_size] = 1 - cosine_similarity_matrix
        np.fill_diagonal(cosine_distance_matrix, 0)
        return cosine_distance_matrix

    def strategy(self, labels, distance_matrix):
        n = len(labels)
        threshold_correct_counters = {
            threshold: {"compare_single_metric": {"TP": 0, "FP": 0, "TN": 0, "FN": 0}}
            for threshold in self.thresholds
        }
        for i in tqdm(range(n), desc="Evaluating strategy"):
            threshold_correct_counters = self.predict_metric_compare_single_v2(
                labels=labels,
                target_idx=i,
                distance_matrix=distance_matrix,
                threshold_correct_counters=threshold_correct_counters
            )
            threshold_correct_counters = self.predict_metric_compare_single_unknown_v2(
                labels=labels,
                target_idx=i,
                distance_matrix=distance_matrix,
                threshold_correct_counters=threshold_correct_counters
            )
        return threshold_correct_counters

    def predict_metric_compare_single_v2(self, labels, target_idx, distance_matrix, threshold_correct_counters):
        distance_matrix[target_idx][target_idx] = np.inf
        min_id = labels[np.argmin(distance_matrix[target_idx])]
        min_dis = np.min(distance_matrix[target_idx])
        for threshold in self.thresholds:
            if min_id == labels[target_idx] and min_dis <= threshold:
                threshold_correct_counters[threshold]['compare_single_metric']['TP'] += 1
            else:
                if min_dis <= threshold:
                    threshold_correct_counters[threshold]['compare_single_metric']['FP'] += 1
                threshold_correct_counters[threshold]['compare_single_metric']['FN'] += 1
        distance_matrix[target_idx][target_idx] = 0
        return threshold_correct_counters

    def predict_metric_compare_single_unknown_v2(self, labels, target_idx, distance_matrix, threshold_correct_counters):
        target_label = labels[target_idx]
        distance_matrix[target_idx][target_idx] = np.inf
        mask = labels != target_label
        masked_distances = distance_matrix[target_idx][mask]
        min_id = labels[mask][np.argmin(masked_distances)]
        min_dis = np.min(masked_distances)
        for threshold in self.thresholds:
            if min_dis > threshold:
                threshold_correct_counters[threshold]['compare_single_metric']['TN'] += 1
            else:
                threshold_correct_counters[threshold]['compare_single_metric']['FP'] += 1
        distance_matrix[target_idx][target_idx] = 0
        return threshold_correct_counters

    def summary_results(self, threshold_correct_counters):
        max_acc = max_precision = max_recall = max_selectivity = 0
        precision_list = []
        recall_list = []

        for threshold, metrics in threshold_correct_counters.items():
            TP = metrics["compare_single_metric"]["TP"]
            FP = metrics["compare_single_metric"]["FP"]
            TN = metrics["compare_single_metric"]["TN"]
            FN = metrics["compare_single_metric"]["FN"]

            precision = TP / (TP + FP) if TP + FP > 0 else 0
            recall = TP / (TP + FN) if TP + FN > 0 else 0
            acc = (TP + TN) / (TP + FP + TN + FN) if TP + FP + TN + FN > 0 else 0
            selectivity = TN / (TN + FP) if TN + FP > 0 else 0

            max_acc = max(max_acc, acc)
            max_precision = max(max_precision, precision)
            max_recall = max(max_recall, recall)
            max_selectivity = max(max_selectivity, selectivity)

            precision_list.append(precision)
            recall_list.append(recall)

        auc_val = auc(recall_list, precision_list)
        return max_acc, max_precision, max_recall, max_selectivity, auc_val
