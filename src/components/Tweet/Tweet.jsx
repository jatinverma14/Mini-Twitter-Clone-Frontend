import axios from "axios";
import React, { useState, useEffect } from "react";
import formatDistance from "date-fns/formatDistance";

import { Link, useLocation, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

import app from "../../firebase";
import { changeProfile } from "../../redux/userSlice";

import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import DeleteIcon from "@mui/icons-material/Delete";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";

const Tweet = ({ tweet, setData }) => {
  const { currentUser } = useSelector((state) => state.user);

  const [userData, setUserData] = useState();

  const dateStr = formatDistance(new Date(tweet.createdAt), new Date());
  const location = useLocation().pathname;
  const { id } = useParams();

  const [editTweet, setEditTweet] = useState(tweet.description);

  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: "1px solid #000",
    boxShadow: 24,
    p: 4,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const findUser = await axios.get(`/users/find/${tweet.userId}`);

        setUserData(findUser.data);
      } catch (err) {
        console.log("error", err);
      }
    };

    fetchData();
  }, [tweet.userId, tweet.likes]);

  const showTweets = async () => {
    if (location.includes("profile")) {
      const newData = await axios.get(`/tweets/user/all/${id}`);
      setData(
        newData.data.sort((p1, p2) => {
          return new Date(p2.createdAt) - new Date(p1.createdAt);
        })
      );
    } else if (location.includes("explore")) {
      const newData = await axios.get(`/tweets/explore`);
      setData(
        newData.data.sort((p1, p2) => {
          return new Date(p2.createdAt) - new Date(p1.createdAt);
        })
      );
    } else {
      const newData = await axios.get(`/tweets/timeline/${currentUser._id}`);
      setData(
        newData.data.sort((p1, p2) => {
          return new Date(p2.createdAt) - new Date(p1.createdAt);
        })
      );
    }
  };

  const handleLike = async (e) => {
    e.preventDefault();

    try {
      const like = await axios.put(`/tweets/${tweet._id}/like`, {
        id: currentUser._id,
      });

      showTweets();
    } catch (err) {
      console.log("error", err);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    try {
      const delTweet = await axios.delete(`/tweets/${tweet._id}`, {
        data: { id: currentUser._id },
      });

      showTweets();
    } catch (err) {
      alert("You can't delete someone else's tweet!");
      console.log("error", err);
    }
  };

  const [editImg, setEditImg] = useState(tweet.tweetImage);
  const [img, setImg] = useState(null);
  const [imgUploadProgress, setImgUploadProgress] = useState(0);

  const dispatch = useDispatch();

  const uploadImg = (file) => {
    const storage = getStorage(app);
    const fileName = new Date().getTime() + file.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Listen for state changes, errors, and completion of the upload.
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setImgUploadProgress(Math.round(progress));
        switch (snapshot.state) {
          case "paused":
            console.log("Upload is paused");
            break;
          case "running":
            console.log("Upload is running");
            break;
          default:
            break;
        }
      },
      (error) => {},
      () => {
        // Upload completed successfully, now we can get the download URL
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
          try {
            setEditImg(downloadURL);
          } catch (error) {
            console.log(error);
          }
          dispatch(changeProfile(downloadURL));
        });
      }
    );
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const post = await axios.put(`/tweets/${tweet._id}/edittweet`, {
        id: currentUser._id,
        isEdited: true,
        description: editTweet,
        tweetImage: editImg,
      });

      showTweets();
      handleClose();
      setImgUploadProgress(0);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    img && uploadImg(img);
  }, [img]);

  return (
    <div>
      {userData && (
        <>
          <div className="flex space-x-2">
            <Link to={`/profile/${userData._id}`}>
              <h3 className="font-bold" style={{ textTransform: "capitalize" }}>
                {userData.username}
              </h3>
            </Link>

            <span className="font-normal">@{userData.username}</span>
            <p> - {dateStr}</p>
          </div>

          {/* {console.log("tweet: ", tweet)} */}

          <p>{tweet.description}</p>
          {tweet.tweetImage ? (
            <img
              src={tweet.tweetImage}
              alt="Tweet Image"
              style={{ width: 200 }}
            />
          ) : null}
          {tweet.isEdited ? (
            <div className="text-xs text-red-600">(Edited)</div>
          ) : null}
          <button onClick={handleLike}>
            {tweet.likes.includes(currentUser._id) ? (
              <FavoriteIcon className="mr-2 my-2 cursor-pointer"></FavoriteIcon>
            ) : (
              <FavoriteBorderIcon className="mr-2 my-2 cursor-pointer"></FavoriteBorderIcon>
            )}
            {tweet.likes.length}
          </button>
          <button onClick={handleDelete}>
            {tweet.userId === currentUser._id ? (
              <DeleteIcon className="fill-red ml-4 my-2 cursor-pointer"></DeleteIcon>
            ) : null}
          </button>
          <button>
            {tweet.userId === currentUser._id ? (
              <div>
                <Button onClick={handleOpen}>
                  <ModeEditIcon className="my-2 cursor-pointer"></ModeEditIcon>
                </Button>
                <Modal
                  open={open}
                  onClose={handleClose}
                  aria-labelledby="modal-modal-title"
                  aria-describedby="modal-modal-description"
                >
                  <Box sx={style}>
                    <Typography
                      id="modal-modal-title"
                      variant="h6"
                      component="h2"
                    >
                      Edit your tweet!
                    </Typography>
                    <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                      <form className="border-b-2 pb-6">
                        <textarea
                          onChange={(e) => setEditTweet(e.target.value)}
                          type="text"
                          maxLength={11000}
                          className="bg-slate-200 rounded-lg w-full p-2"
                        >
                          {tweet.description}
                        </textarea>
                        {tweet.tweetImage ? (
                          <img src={tweet.tweetImage} alt="Tweet image" />
                        ) : null}
                        {imgUploadProgress > 0 ? (
                          "Uploading " + imgUploadProgress + "%"
                        ) : (
                          <input
                            type="file"
                            className="bg-transparent border border-slate-500 rounded p-2"
                            accept="image/*"
                            onChange={(e) => setImg(e.target.files[0])}
                            style={{ width: 150, marginRight: 8 }}
                          />
                        )}
                        <button
                          onClick={handleEdit}
                          className="bg-blue-500 text-white py-2 px-4 rounded-full ml-auto"
                        >
                          Update
                        </button>
                      </form>
                    </Typography>
                  </Box>
                </Modal>
              </div>
            ) : null}
          </button>
        </>
      )}
    </div>
  );
};

export default Tweet;
