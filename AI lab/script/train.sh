# * AdaFace R50 with tinyface dataset

python train.py --train_path data/train_test --model_name vit_t --head_type adaface --embedding_size 512 --lr 0.1 --num_epochs 20 --num_gpus 1 --batch_size 32 --optimizer sgd --output_path result/ir_18_WebFace_4M_Aug --low_res_augmentation_prob 0.2 --crop_augmentation_prob 0.2 --photometric_augmentation_prob 0.2

python train.py --train_path data/train_test --model_name ir_18 --head_type adaface --embedding_size 512 --lr 0.1 --num_epochs 20 --num_gpus 1 --batch_size 32 --optimizer sgd --output_path result/ir_18_WebFace_4M_Aug --low_res_augmentation_prob 0.2 --crop_augmentation_prob 0.2 --photometric_augmentation_prob 0.2

python train.py \
--train_path data/train_test \
--model_name ir_18 \
--head_type adaface \
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

python train.py \
--train_path data/train_test \
--model_name ir_34 \
--head_type adaface \
--embedding_size 512 \
--lr 0.1 \
--num_epochs 20 \
--num_gpus 1 \
--batch_size 32 \
--optimizer sgd \
--output_path result/ir_34_5k_test \
--low_res_augmentation_prob 0.2 \
--crop_augmentation_prob 0.2 \
--photometric_augmentation_prob 0.2

python train.py \
--train_path data/train_test \
--model_name ir_50 \
--head_type adaface \
--embedding_size 512 \
--lr 0.1 \
--num_epochs 20 \
--num_gpus 1 \
--batch_size 32 \
--optimizer sgd \
--output_path result/ir_34_5k_test \
--low_res_augmentation_prob 0.2 \
--crop_augmentation_prob 0.2 \
--photometric_augmentation_prob 0.2

python train.py \
--train_path data/train_test \
--model_name vit_t \
--head_type adaface \
--embedding_size 512 \
--lr 0.1 \
--num_epochs 20 \
--num_gpus 1 \
--batch_size 32 \
--optimizer sgd \
--output_path result/vit_t_5k_test \
--low_res_augmentation_prob 0.2 \
--crop_augmentation_prob 0.2 \
--photometric_augmentation_prob 0.2

python train.py \
--train_path data/train_test \
--model_name vit_t_dp005_mask0 \
--head_type adaface \
--embedding_size 512 \
--lr 0.1 \
--num_epochs 20 \
--num_gpus 1 \
--batch_size 32 \
--optimizer sgd \
--output_path result/vit_t_dp005_mask0_5k_test \
--low_res_augmentation_prob 0.2 \
--crop_augmentation_prob 0.2 \
--photometric_augmentation_prob 0.2

python train.py \
--train_path data/train_test \
--model_name vit_s \
--head_type adaface \
--embedding_size 512 \
--lr 0.1 \
--num_epochs 20 \
--num_gpus 1 \
--batch_size 32 \
--optimizer sgd \
--output_path result/vit_s \
--low_res_augmentation_prob 0.2 \
--crop_augmentation_prob 0.2 \
--photometric_augmentation_prob 0.2

python train.py \
--train_path data/train_test \
--model_name vit_s_dp005_mask0 \
--head_type adaface \
--embedding_size 512 \
--lr 0.1 \
--num_epochs 20 \
--num_gpus 1 \
--batch_size 32 \
--optimizer sgd \
--output_path result/vit_s_dp005_mask0_5k_test \
--low_res_augmentation_prob 0.2 \
--crop_augmentation_prob 0.2 \
--photometric_augmentation_prob 0.2

python train.py \
--train_path data/train_test \
--model_name vit_b \
--head_type adaface \
--embedding_size 512 \
--lr 0.1 \
--num_epochs 20 \
--num_gpus 1 \
--batch_size 32 \
--optimizer sgd \
--output_path result/vit_b_5k_test \
--low_res_augmentation_prob 0.2 \
--crop_augmentation_prob 0.2 \
--photometric_augmentation_prob 0.2

python train.py \
--train_path data/train_test \
--model_name vit_b_dp005_mask_005 \
--head_type adaface \
--embedding_size 512 \
--lr 0.1 \
--num_epochs 20 \
--num_gpus 1 \
--batch_size 32 \
--optimizer sgd \
--output_path result/vit_b_dp005_mask_005_5k_test \
--low_res_augmentation_prob 0.2 \
--crop_augmentation_prob 0.2 \
--photometric_augmentation_prob 0.2