
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  AppBar,
  Toolbar,
  Container,
  Box,
} from "@mui/material";
import ModalVideo from "react-modal-video";
import "react-modal-video/scss/modal-video.scss";
import Footer from "../Footer";
import Navbar from "../Navbar";
import { useSelector } from "react-redux";

const YoutubeVideo = () => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [videos, setVideos] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [videoId, setVideoId] = useState("");
  const { userInfo } = useSelector((state) => state.signIn);

  const handleSearch = async () => {
    try {
      const maxResults = 12;
      const apiKey = "AIzaSyDk0Yz3cXwQEcTsn3xPytCOghpM5_i432U";
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchKeyword} study Material&type=video&maxResults=${maxResults}&key=${apiKey}`
      );
      const videos = response.data?.items;
      setVideos(videos);
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  };

  const openModal = (videoId) => {
    setVideoId(videoId);
    setIsOpen(true);
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div>
      <Navbar />
      <AppBar position="static" sx={{ bgcolor: "white", paddingBottom: "7px" }}>
        <Toolbar sx={{ justifyContent: "center" }}>
          <TextField
            label="Search"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            sx={{
              backgroundColor: "white",
              color: "primary.main",
              mr: 2,
              "& .MuiInputBase-root": {
                height: "40px",
                padding: "6px 10px",
                display: "flex",
                alignItems: "center",
                marginTop: "8px",
              },
            }}
          />

          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{
              bgcolor: "secondary.main",
              color: "white",
              height: "40px",
              padding: "6px 16px",
              marginTop: "7px",
            }}
          >
            Search
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 5, minHeight: "80vh" }}>
        <Grid container spacing={3}>
          {videos.map((video) => (
            <Grid item xs={12} sm={6} md={4} key={video.id.videoId}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <img
                  src={video.snippet.thumbnails.medium.url}
                  alt=""
                  style={{ height: "210px", objectFit: "cover" }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="h6"
                    component="div"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    {video.snippet.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      mb: 1,
                    }}
                  >
                    {video.snippet.channelTitle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {video.snippet.description}
                  </Typography>
                </CardContent>
                <Box sx={{ p: 1, textAlign: "center" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={() => openModal(video.id.videoId)}
                  >
                    View Video
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
      <ModalVideo
        channel="youtube"
        isOpen={isOpen}
        videoId={videoId}
        onClose={() => setIsOpen(false)}
      />

      <div style={{ marginTop: "50px" }}>
        <Footer />
      </div>
    </div>
  );
};

export default YoutubeVideo;
