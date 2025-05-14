# * AdaFace R50 with tinyface dataset

python train.py \
--train_path data/mini_train \
--model_name ir_18 \
--head_type adaface \
--embedding_size 512 \
--lr 0.1 \
--num_epochs 20 \
--num_gpus 1 \
--batch_size 32 \
--optimizer sgd \
--output_path out \
--low_res_augmentation_prob 0.2 \
--crop_augmentation_prob 0.2 \
--photometric_augmentation_prob 0.2


python train.py \
--train_path data/mini_train \
--model_name ir_18 \
--head_type arcface \
--embedding_size 512 \
--lr 0.1 \
--num_epochs 20 \
--num_gpus 1 \
--batch_size 32 \
--optimizer sgd \
--output_path result/ir_18_5k_test \
--low_res_augmentation_prob 0.2 \
--crop_augmentation_prob 0.2 \
--photometric_augmentation_prob 0.2
