import { Box, Button, Typography } from "@mui/material";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import CardElement from "../../component/CardElement";
import LoadingBox from "../../component/LoadingBox";
import { savedJobsLoadAction } from "../../redux/actions/savedJobAction";
import { removeSavedJobAction } from "../../redux/actions/savedJobAction";

const SavedJobs = () => {
  const dispatch = useDispatch();
  const { savedJobs = [], loading } = useSelector((state) => state.savedJobs);
  const { userInfo } = useSelector((state) => state.signIn);

  useEffect(() => {
    if (userInfo) {
      const userId = userInfo?.role?._id || userInfo?._id;
      dispatch(savedJobsLoadAction(userId));
    }
  }, [dispatch, userInfo]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ color: "black" }}>
          Saved Jobs
        </Typography>
        <Button component={Link} to="/" variant="outlined">
          Browse jobs
        </Button>
      </Box>
      {loading ? (
        <LoadingBox />
      ) : savedJobs.length === 0 ? (
        <Typography sx={{ color: "text.secondary" }}>
          You have not saved any jobs yet.
        </Typography>
      ) : (
        savedJobs.map(({ job }) => (
          <CardElement
            key={job._id}
            id={job._id}
            jobTitle={job.title}
            companyName={job.companyName}
            description={job.description}
            category={job.jobType}
            location={job.location}
            profilePhoto={job.user?.profilePhoto}
            detailsLabel="View Details"
            onRemove={() => dispatch(removeSavedJobAction(job._id))}
          />
        ))
      )}
    </Box>
  );
};

export default SavedJobs;
