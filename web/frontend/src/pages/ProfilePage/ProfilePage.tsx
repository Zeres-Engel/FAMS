import { Alert, CircularProgress, Container, Grid, Typography } from "@mui/material";
import React from "react";
import "./ProfilePage.scss";
import LayoutComponent from "../../components/Layout/Layout";
import useProfilePage from "./useProfilePage";
import { formatDate } from "../../utils/dateUtils";

function ProfilePage(): React.JSX.Element {
  const { profileData, isLoading, error } = useProfilePage();

  if (isLoading) {
    return (
      <LayoutComponent pageHeader="Profile Information">
        <Container maxWidth={false} className="profilePage-Container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Container>
      </LayoutComponent>
    );
  }

  if (error) {
    return (
      <LayoutComponent pageHeader="Profile Information">
        <Container maxWidth={false} className="profilePage-Container">
          <Alert severity="error">{error}</Alert>
        </Container>
      </LayoutComponent>
    );
  }

  return (
    <LayoutComponent pageHeader="Profile Information">
      <Container maxWidth={false} className="profilePage-Container">
        {profileData && (
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
                    Role:
                  </Typography>
                  {profileData.role === 'Student' && profileData.profile?.classId && (
                    <Typography component="div" className="img-infor-item-left">
                      Class:
                    </Typography>
                  )}
                </Grid>
                <Grid className="img-infor-item-right">
                  <Typography component="div">{profileData.name}</Typography>
                  <Typography component="div">{profileData.userId}</Typography>
                  <Typography component="div">{profileData.role}</Typography>
                  {profileData.role === 'Student' && profileData.profile?.classId && (
                    <Typography component="div">{profileData.profile.classId.name}</Typography>
                  )}
                </Grid>
              </Grid>
            </Grid>
            <Grid size={6} className="profile-Right">
              <Grid size={3} className="profile-Right-Infor">
                <Typography component="div" className="infor-item-left">
                  User ID:
                </Typography>
                <Typography component="div" className="infor-item-left">
                  Email:
                </Typography>
                <Typography component="div" className="infor-item-left">
                  Full name:
                </Typography>
                {/* Always show Date of Birth field */}
                <Typography component="div" className="infor-item-left">
                  Date Of Birth:
                </Typography>
                {/* Always show gender field, regardless of its value */}
                {profileData.profile && 'gender' in profileData.profile && (
                  <Typography component="div" className="infor-item-left">
                    Gender:
                  </Typography>
                )}
                {profileData.role === 'Student' && profileData.profile?.classId && (
                  <Typography component="div" className="infor-item-left">
                    Class:
                  </Typography>
                )}
                {profileData.profile?.address && (
                  <Typography component="div" className="infor-item-left">
                    Address:
                  </Typography>
                )}
                {profileData.profile?.phone && (
                  <Typography component="div" className="infor-item-left">
                    Phone:
                  </Typography>
                )}
                {profileData.role === 'Teacher' && profileData.profile?.classes && (
                  <Typography component="div" className="infor-item-left">
                    Classes:
                  </Typography>
                )}
                {profileData.role === 'Student' && profileData.profile?.classId?.homeroomTeacherId && (
                  <Typography component="div" className="infor-item-left">
                    Homeroom Teacher:
                  </Typography>
                )}
              </Grid>
              <Grid size={6} className="profile-Right-Infor-Main">
                <Typography component="div" className="infor-item-right">
                  {profileData.userId}
                </Typography>
                <Typography component="div" className="infor-item-right">
                  {profileData.email}
                </Typography>
                <Typography component="div" className="infor-item-right">
                  {profileData.name}
                </Typography>
                {/* Always show Date of Birth value */}
                <Typography component="div" className="infor-item-right">
                  {profileData.profile?.dateOfBirth 
                    ? formatDate(profileData.profile.dateOfBirth)
                    : "Not provided"}
                </Typography>
                {/* Always show gender value, regardless of its boolean value */}
                {profileData.profile && 'gender' in profileData.profile && (
                  <Typography component="div" className="infor-item-right">
                    {typeof profileData.profile.gender === 'boolean' 
                      ? (profileData.profile.gender ? 'Male' : 'Female')
                      : (profileData.profile.gender === 'true' ? 'Male' : 'Female')}
                  </Typography>
                )}
                {profileData.role === 'Student' && profileData.profile?.classId && (
                  <Typography component="div" className="infor-item-right">
                    {profileData.profile.classId.name}
                  </Typography>
                )}
                {profileData.profile?.address && (
                  <Typography component="div" className="infor-item-right">
                    {profileData.profile.address}
                  </Typography>
                )}
                {profileData.profile?.phone && (
                  <Typography component="div" className="infor-item-right">
                    {profileData.profile.phone}
                  </Typography>
                )}
                {profileData.role === 'Teacher' && profileData.profile?.classes && (
                  <Typography component="div" className="infor-item-right">
                    {profileData.profile.classes.map((cls: {className: string}) => cls.className).join(', ')}
                  </Typography>
                )}
                {profileData.role === 'Student' && profileData.profile?.classId?.homeroomTeacherId && (
                  <Typography component="div" className="infor-item-right">
                    {profileData.profile.classId.homeroomTeacherId.name}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Grid>
        )}
      </Container>
    </LayoutComponent>
  );
}
export default ProfilePage;
