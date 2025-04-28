python eval.py --valid_path data/high_res_angle_test/combination --model_type arcface --batch_size 32 --model_name ir_50 --output_path sample --checkpoint_path /home/akacamcore/thanhnp12ms1mv3_arcface_r50.pth

python eval.py --valid_path data/test --model_type adaface --batch_size 32 --model_name ir_18 --output_path sample --checkpoint_path model/adaface_ir18_webface4m_aug.ckpt

python eval.py \
--valid_path "/home/akacamcore/thanhnp12/ACB_retinaface_balance" \
--model_type arcface \
--batch_size 32 \
--model_name ir_50 \
--output_path sample \
--checkpoint_path /home/akacamcore/thanhnp12/ms1mv3_arcface_r50.pth

python eval.py \
--valid_path "/home/akacamcore/thanhnp12/ACB_retinaface_balance" \
--model_type arcface \
--batch_size 32 \
--model_name ir_50 \
--output_path sample \
--checkpoint_path /home/akacamcore/thanhnp12/glint360K_cosface_r50.pth

python eval.py \
--valid_path "/home/akacamcore/thanhnp12/ACB_retinaface_balance" \
--model_type arcface \
--batch_size 32 \
--model_name ir_100 \
--output_path sample \
--checkpoint_path /home/akacamcore/thanhnp12/ms1mv3_arcface_r100.pth

python eval.py \
--valid_path "/home/akacamcore/thanhnp12/ACB_retinaface_balance" \
--model_type arcface \
--batch_size 32 \
--model_name ir_100 \
--output_path sample \
--checkpoint_path /home/akacamcore/thanhnp12/glint360K_cosface_r100.pth

python eval.py \
--valid_path "/home/akacamcore/thanhnp12/ACB_retinaface_balance" \
--model_type adaface \
--batch_size 32 \
--model_name ir_50 \
--output_path sample \
--checkpoint_path /home/akacamcore/thanhnp12/adaface_ir50_casia.ckpt

python eval.py \
--valid_path "/home/akacamcore/thanhnp12/ACB_retinaface_balance" \
--model_type adaface \
--batch_size 32 \
--model_name ir_50 \
--output_path sample \
--checkpoint_path /home/akacamcore/thanhnp12/adaface_ir50_webface4m.ckpt

python eval.py \
--valid_path "/home/akacamcore/thanhnp12/ACB_retinaface_balance" \
--model_type adaface \
--batch_size 32 \
--model_name ir_101 \
--output_path sample \
--checkpoint_path /home/akacamcore/thanhnp12/adaface_ir101_webface12m.ckpt

python eval.py \
--valid_path "/home/akacamcore/thanhnp12/ACB_retinaface_balance" \
--model_type arcface \
--batch_size 32 \
--model_name ir_50 \
--output_path sample \
--checkpoint_path /home/akacamcore/thanhnp12/LocNXArcFace.pt

python eval.py \
--valid_path "/home/akacamcore/thanhnp12/ACB_retinaface_balance" \
--model_type adaface \
--batch_size 32 \
--model_name ir_50 \
--output_path sample \
--checkpoint_path /home/akacamcore/thanhnp12/adaface_asians.ckpt

python eval.py \
--valid_path "/home/akacamcore/thanhnp12/ACB_retinaface" \
--model_type adaface \
--batch_size 32 \
--model_name ir_18 \
--output_path sample \
--checkpoint_path /home/akacamcore/thanhnp12/adaface_ir18_casia.ckpt

python eval.py \
--valid_path "/home/akacamcore/thanhnp12/ACB_retinaface" \
--model_type adaface \
--batch_size 32 \
--model_name ir_18 \
--output_path sample \
--checkpoint_path /home/akacamcore/thanhnp12/adaface_ir18_vgg2.ckpt

python eval.py \
--valid_path "/home/akacamcore/thanhnp12/ACB_retinaface_balance" \
--model_type adaface \
--batch_size 32 \
--model_name ir_18 \
--output_path sample \
--checkpoint_path /home/akacamcore/thanhnp12/adaface_ir18_webface4m.ckpt

python eval.py \
--valid_path "/home/akacamcore/thanhnp12/ACB_retinaface" \
--model_type adaface \
--batch_size 32 \
--model_name ir_50 \
--output_path sample \
--checkpoint_path /home/akacamcore/thanhnp12/adaface_ir50_ms1mv2.ckpt

python eval.py --valid_path "data/high_res_bin_test" --val_target agedb_30 calfw cfp_ff cfp_fp cplfw lfw vgg2_fp --model_type adaface --batch_size 32 --model_name ir_18 --output_path sample --checkpoint_path ir_18.pth

python eval.py --valid_path "data/high_res_bin_test" --val_target agedb_30 calfw cfp_ff cfp_fp cplfw lfw vgg2_fp --model_type adaface --batch_size 32 --model_name ir_50 --output_path sample --checkpoint_path ir_34.pth

python eval.py --valid_path "data/high_res_bin_test" --val_target agedb_30 calfw cfp_ff cfp_fp cplfw lfw vgg2_fp --model_type adaface --batch_size 32 --model_name vit_t --output_path sample --checkpoint_path vit_t.pth

python eval.py --valid_path "data/high_res_bin_test" --val_target agedb_30 calfw cfp_ff cfp_fp cplfw lfw vgg2_fp --model_type adaface --batch_size 32 --model_name vit_t_dp005_mask0 --output_path sample --checkpoint_path vit_t_dp005_mask0.pth