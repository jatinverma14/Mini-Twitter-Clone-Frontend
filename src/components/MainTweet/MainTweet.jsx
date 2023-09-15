import React, { useState, useEffect } from "react";
import TimelineTweet from "../TimelineTweet/TimelineTweet";

import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

import app from "../../firebase";
import { changeProfile } from "../../redux/userSlice";


const MainTweet = () => {
  const [tweetText, setTweetText] = useState("");

  const { currentUser } = useSelector((state) => state.user);

  const [img, setImg] = useState(null);
  const [imgUploadProgress, setImgUploadProgress] = useState(0);
  const [tweetImgUrl, setTweetImgUrl] = useState("");

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
            // const updateProfile = await axios.put(`/users/${currentUser._id}`, {
            //   profilePicture: downloadURL,
            // });
            setTweetImgUrl(downloadURL);

            // console.log(updateProfile);
          } catch (error) {
            console.log(error);
          }

          // console.log("downloaded " + downloadURL);
          dispatch(changeProfile(downloadURL));
        });
      }
    );
  };

  useEffect(() => {
    img && uploadImg(img);
  }, [img]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitTweet = await axios.post("/tweets", {
        userId: currentUser._id,
        description: tweetText,
        tweetImage: tweetImgUrl,
      });
      window.location.reload(false);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      {currentUser && (
        <p
          className="font-bold pl-2 my-2 capitalize"
        >
          {currentUser.username}
        </p>
      )}

      <form className="border-b-2 pb-6">
        <textarea
          onChange={(e) => setTweetText(e.target.value)}
          type="text"
          placeholder="What's happening...?"
          maxLength={11000}
          className="bg-slate-200 rounded-lg w-full p-2"
        ></textarea>
        {/* <ImageIcon className="mr-4 cursor-pointer" onClick={handleImageClick} /> */}
        {imgUploadProgress > 0 ? (
          "Uploading " + imgUploadProgress + "%"
        ) : (
          <input
            type="file"
            className="bg-transparent border border-slate-500 rounded p-2"
            accept="image/*"
            onChange={(e) => setImg(e.target.files[0])}
            style={{width:110, marginRight:8}}
          />
        )}
        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white py-2 px-4 rounded-full ml-auto"
        >
          Tweet
        </button>
      </form>
      <TimelineTweet />
    </div>
  );
};

export default MainTweet;
