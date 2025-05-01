# preprocess img
python get_aligned_face.py --input data/lfw --output out/lfw --batch_size 8 --score 0.01 --network resnet50 --checkpoint_path model/Resnet50_Final.pth --continue --head_pose --head_pose_checkpoint_path model/6DRepNet_70_30_BIWI.pth --save_format json

python get_aligned_face.py \
    --input /home/akacamcore/locnx12/AkaFace_project/data/WebFace12M \
    --output /home/akacamcore/thanhnp12/WebFace12M_angle \
    --batch_size 32 \
    --score 0.01 \
    --network resnet50 \
    --checkpoint_path model/Resnet50_Final.pth \
    --continue \
    --head_pose \
    --head_pose_checkpoint_path model/6DRepNet_70_30_BIWI.pth \
    --save_format json

python get_aligned_face.py --input data/test --output out --batch_size 8 --score 0.01 --network resnet50 --checkpoint_path model/Resnet50_Final.pth --head_pose --continue --head_pose_checkpoint_path model/6DRepNet_70_30_BIWI.pth --save_format json