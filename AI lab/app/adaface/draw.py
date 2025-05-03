import os
import matplotlib.pyplot as plt
import numpy as np

def plot_metric(self, epochs, values, label, xlabel, ylabel, title, filename):
    plt.figure(figsize=(10, 8))
    color = "skyblue" if label == "Loss" else "lightgreen" if label == "Accuracy" else "lightcoral"
    plt.fill_between(epochs, values, color=color, alpha=0.4)
    plt.plot(epochs, values, label=label, marker='o', linestyle='-', markersize=5, color=color, alpha=0.9)
    max_value = max(values)
    max_epoch = epochs[values.index(max_value)]
    plt.text(max_epoch, max_value, f'Max: {max_value:.2f}', ha='center', va='bottom', fontsize=9, bbox=dict(facecolor='white', alpha=0.5))
    plt.title(title)
    plt.xlabel(xlabel)
    plt.ylabel(ylabel)
    plt.xticks(np.arange(min(epochs), max(epochs)+1, 1.0))
    plt.legend()
    plt.grid(True, linestyle='--', linewidth=0.5, alpha=0.7)
    plt.gca().spines['top'].set_visible(False)
    plt.gca().spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(os.path.join(self.output_path, filename))
    plt.close()

def plot_metric_v2(self, epochs, values_epoch, values_step, xlabel, ylabel, title, filename):
    plt.figure(figsize=(10, 8))
    color_epoch = "darkblue"
    plt.plot(epochs, values_epoch, label=f"{ylabel} per Epoch", marker='o', linestyle='-', markersize=8, color=color_epoch, alpha=0.9, linewidth=2)
    steps = np.linspace(1, max(epochs), len(values_step))
    color_step = "lightgrey"
    plt.plot(steps, values_step, label=f"{ylabel} per Step", marker='x', linestyle='--', markersize=5, color=color_step, alpha=0.7)
    plt.title(title)
    plt.xlabel(xlabel)
    plt.ylabel(ylabel)
    plt.xticks(np.arange(min(epochs), max(epochs)+1, 1.0))
    plt.legend()
    plt.grid(True, linestyle='--', linewidth=0.5, alpha=0.7)
    plt.gca().spines['top'].set_visible(False)
    plt.gca().spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(os.path.join(self.output_path, filename))
    plt.close()

def plot_metrics_combined(self, epochs, values1, values2, values3, label1, label2, label3, xlabel, ylabel, title, filename):
    plt.figure(figsize=(12, 9))
    colors = ["Slateblue", "Crimson", "DarkOrange"]
    markers = ['o', 's', '^']
    fill_alphas = [0.4, 0.3, 0.2]
    plot_alphas = [0.9, 0.8, 0.7]
    for i, (values, label, color) in enumerate(zip([values1, values2, values3], [label1, label2, label3], colors)):
        plt.fill_between(epochs, values, color=color, alpha=fill_alphas[i])
        plt.plot(epochs, values, label=label, marker=markers[i], linestyle='-', markersize=5, color=color, alpha=plot_alphas[i])
        max_value = max(values)
        max_epoch = epochs[values.index(max_value)]
        plt.text(max_epoch, max_value, f'{label} Max: {max_value:.2f}', ha='right', va='bottom', fontsize=9, bbox=dict(facecolor='white', alpha=0.5))
    plt.title(title)
    plt.xlabel(xlabel)
    plt.ylabel(ylabel)
    plt.xticks(np.arange(min(epochs), max(epochs)+1, 1.0))
    plt.legend()
    plt.grid(True, linestyle='--', linewidth=0.5, alpha=0.7)
    plt.gca().spines['top'].set_visible(False)
    plt.gca().spines['right'].set_visible(False)
    plt.tight_layout()
    plt.savefig(os.path.join(self.output_path, filename))
    plt.close()
