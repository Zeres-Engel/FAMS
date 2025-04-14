import { Container, Grid, Typography } from "@mui/material";
import React from "react";
import "./ProfilePage.scss";
import LayoutComponent from "../../components/Layout/Layout";
function ProfilePage(): React.JSX.Element {
  return (
    <LayoutComponent  pageHeader="Profile Information">
      <Container maxWidth={false} className="profilePage-Container">
        <Grid container size={12} className="profilePage-Grid">
          <Grid size={4} className="profile-Left">
            <Grid size={12} className="profile-Img">
              <img
                src="https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg"
                alt="User Avatar"
              />
            </Grid>
            <Grid size={9} container className="img-information">
              <Grid size={2} className="img-infor-left">
                <Typography component="div" className="img-infor-item-left">
                  Name:
                </Typography>
                <Typography component="div" className="img-infor-item-left">
                  ID:
                </Typography>
                <Typography component="div" className="img-infor-item-left">
                  Batch:
                </Typography>
                <Typography component="div" className="img-infor-item-left">
                  Class:
                </Typography>
              </Grid>
              <Grid className="img-infor-item-right">
                <Typography component="div">Nguyễn Văn A</Typography>
                <Typography component="div">A001</Typography>
                <Typography component="div">2025-2026</Typography>
                <Typography component="div">AI002</Typography>
              </Grid>
            </Grid>
          </Grid>
          <Grid size={6} className="profile-Right">
            <Grid size={3} className="profile-Right-Infor">
              <Typography component="div" className="infor-item-left">
                User ID:
              </Typography>
              <Typography component="div" className="infor-item-left">
                Username:
              </Typography>
              <Typography component="div" className="infor-item-left">
                Full name:
              </Typography>
              <Typography component="div" className="infor-item-left">
                Date Of Birth:
              </Typography>
              <Typography component="div" className="infor-item-left">
                Gender:
              </Typography>
              <Typography component="div" className="infor-item-left">
                Class ID:
              </Typography>
              <Typography component="div" className="infor-item-left">
                Address:
              </Typography>
              <Typography component="div" className="infor-item-left">
                Phone:
              </Typography>
            </Grid>
            <Grid size={6} className="profile-Right-Infor-Main">
              <Typography component="div" className="infor-item-right">
                A001
              </Typography>
              <Typography component="div" className="infor-item-right">
                Ahihi123
              </Typography>
              <Typography component="div" className="infor-item-right">
                Nguyễn Văn A
              </Typography>
              <Typography component="div" className="infor-item-right">
                1/04/2003
              </Typography>
              <Typography component="div" className="infor-item-right">
                Male
              </Typography>
              <Typography component="div" className="infor-item-right">
                AI002
              </Typography>
              <Typography component="div" className="infor-item-right">
                Chung cư xã hội An Phú Thịnh
              </Typography>
              <Typography component="div" className="infor-item-right">
                0123456789
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </LayoutComponent>
  );
}
export default ProfilePage;
