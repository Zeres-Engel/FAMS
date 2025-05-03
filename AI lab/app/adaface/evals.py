import os
import numpy as np
from tqdm import tqdm
from copy import deepcopy
from sklearn.metrics import auc
 
#from .common import create_folder
#from .graph_drawer import GraphDrawer
 
class LocNXEval:
    def __init__(self, num_classes, val_loader, output_path):
        self.num_classes = num_classes
        self.val_loader = val_loader
        self.thresholds = np.arange(0, 1, 0.01)
 
        self.current_results = {
            "max_acc_metric_compare_single": 0,
            "max_threshold_metric_compare_single": 0,
            "auc_metric_compare_single": 0,
        }
        
        self.auc = 0
 
    def run(self, backbone, graph_name):
        print("Running evaluation...")
        embeddings = []
        labels = []
        backbone = backbone.to('cuda:0')
        backbone.eval()
        for img, local_labels in tqdm(self.val_loader):
            img = img.to('cuda:0')
            local_embeddings = backbone(img)
            if isinstance(local_embeddings, tuple):
                local_embeddings = local_embeddings[0]
            embeddings.extend(local_embeddings.tolist())
            labels.extend(local_labels.tolist())
 
        self.predict_optimize(embeddings, labels, graph_name)
        return self.auc
 
    # /////////////////////////////////////////////////////////////////////////////////////////////////////////
    def predict_optimize(self, embeddings, labels, graph_name):
        # init threshold correct counters
        threshold_correct_counters = dict()
        for threshold in self.thresholds:
            threshold_correct_counters[threshold] = {
                "compare_single_metric": {
                    "TP": 0,
                    "FP": 0,
                    "TN": 0,
                    "FN": 0,
                },
            }
 
        embeddings = np.array(embeddings)
        labels = np.array(labels)
 
        # calculate distance matrix
        distance_matrix = self.find_cosine_distance_matrix(embeddings)
 
        for i in tqdm(range(len(embeddings))):
            # /////////////////////////////////////////////////////////////////////////////////////////////////////////
            threshold_correct_counters = self.predict_metric_compare_single_v2(
                embeddings=embeddings,
                labels=labels,
                target_idx=i,
                distance_matrix=distance_matrix,
                threshold_correct_counters=threshold_correct_counters
            )
 
            threshold_correct_counters = self.predict_metric_compare_single_unknown_v2(
                embeddings=embeddings,
                labels=labels,
                target_idx=i,
                distance_matrix=distance_matrix,
                threshold_correct_counters=threshold_correct_counters
            )
 
        # sumary results
        self.sumary_results(threshold_correct_counters, graph_name)
 
    # ///////////////////////////////////////////////////////////////////////////////////////////////////////// 
    def predict_metric_compare_single_v2(self, embeddings, labels, target_idx, distance_matrix, threshold_correct_counters):
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
    def predict_metric_compare_single_unknown_v2(self, embeddings, labels, target_idx, distance_matrix, threshold_correct_counters):
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
    # /////////////////////////////////////////////////////////////////////////////////////////////////////////
    def sumary_results(self, threshold_correct_counters, graph_name):
        EPSILON = 1e-7  # small constant
 
        # ////////////////////////////////////////////////////////////////////////
        # calculate results for compare single
        precision_list = []
        recall_list = []
        f1_list = []
        acc_list = []
        max_acc = 0
        max_acc_threshold = 0
 
        for threshold in self.thresholds:
            TP = threshold_correct_counters[threshold]['compare_single_metric']['TP']
            FP = threshold_correct_counters[threshold]['compare_single_metric']['FP']
            TN = threshold_correct_counters[threshold]['compare_single_metric']['TN']
            FN = threshold_correct_counters[threshold]['compare_single_metric']['FN']
 
            precision = TP / (TP + FP + EPSILON)
            recall = TP / (TP + FN + EPSILON)
            f1 = 2 * precision * recall / (precision + recall + EPSILON)
 
            precision_list.append(precision)
            recall_list.append(recall)
            f1_list.append(f1)
 
            acc = (TP + TN) / (TP + FP + TN + FN)
            acc_list.append(acc)
            if acc > max_acc:
                max_acc = acc
                max_acc_threshold = threshold
 
        auc_val = auc(recall_list, precision_list)
        self.current_results["max_acc_metric_compare_single"] = max_acc
        self.current_results["max_threshold_metric_compare_single"] = max_acc_threshold
        self.current_results["auc_metric_compare_single"] = auc_val
 
        # print the results
        self.print_results()
    def print_results(self):
        print(f'--------RESULT--------')
        print(f'max_acc_metric_compare_single: {round(self.current_results["max_acc_metric_compare_single"], 4)}')
        print(f'max_threshold_metric_compare_single: {round(self.current_results["max_threshold_metric_compare_single"], 4)}')
        print(f'auc_metric_compare_single: {round(self.current_results["auc_metric_compare_single"], 4)}')
        self.auc = round(self.current_results["auc_metric_compare_single"], 4)
        print(f'----------------------')
 
    # /////////////////////////////////////////////////////////////////////////////////////////////////////////
    def find_cosine_distance_matrix(self, embeddings, batch_size=1000):
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