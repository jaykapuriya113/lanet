// import React from "react";
// import { useFormik } from "formik";
// import * as yup from "yup";
// import { Box, Button, InputBase } from "@mui/material";
// import { useNavigate } from "react-router-dom";

// const validationSchema = yup.object({
//   search: yup
//     .string("Enter your search query")
//     .required("this field can not be empty"),
// });

// const SearchInputEl = () => {
//   const navigate = useNavigate();

//   const onSubmit = (values, actions) => {
//     //alert(values.search);
//     const { search } = values;
//     if (search.trim()) {
//       navigate(`/search/${search}`);
//     } else {
//       navigate("/");
//     }
//     actions.resetForm();
//   };

//   const {
//     values,
//     errors,
//     touched,
//     handleBlur,
//     handleChange,
//     handleSubmit,
//     isSubmitting,
//   } = useFormik({
//     initialValues: {
//       search: "",
//     },

//     validationSchema: validationSchema,
//     onSubmit,
//   });

//   return (
//     <form onSubmit={handleSubmit} style={{ width: "50%" }}>
//       <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
//         {/* <Search> */}

//         <InputBase
//           sx={{ bgcolor: "white", padding: "10px" }}
//           fullWidth={true}
//           id="search"
//           name="search"
//           label="search"
//           placeholder="ex: developer, front end"
//           value={values.search}
//           onChange={handleChange}
//           error={touched.search && Boolean(errors.search)}
//           // helperText={touched.search && errors.search}
//         />

//         <Button
//           color="primary"
//           variant="contained"
//           type="submit"
//           disabled={isSubmitting}
//         >
//           Search
//         </Button>
//       </Box>
//       <Box component="span" sx={{ color: "orange" }}>
//         {touched.search && errors.search}
//       </Box>
//     </form>
//   );
// };

// export default SearchInputEl;

// import React, { useEffect, useState } from "react";
// import { useFormik } from "formik";
// import * as yup from "yup";
// import { Box, Button, InputBase } from "@mui/material";
// import { useNavigate } from "react-router-dom";

// const validationSchema = yup.object({
//   search: yup.string("Enter your search query").required("This field cannot be empty"),
// });

// const SearchInputEl = () => {
//   const navigate = useNavigate();
//   const [isListening, setIsListening] = useState(false);
//   const [recognizedText, setRecognizedText] = useState("");

  // const handleSpeechRecognition = () => {
  //   const SpeechRecognition =
  //     window.SpeechRecognition || window.webkitSpeechRecognition;
  //   const recognition = new SpeechRecognition();

  //   recognition.continuous = false;
  //   recognition.interimResults = false;

  //   recognition.onstart = () => {
  //     setIsListening(true);
  //     setRecognizedText(""); 
  //   };

  //   recognition.onresult = (event) => {
  //     const transcript = event.results[0][0].transcript;
  //     setRecognizedText((prevText) => prevText + transcript);
  //   };

  //   recognition.onend = () => {
  //     setIsListening(false);
  //   };

  //   recognition.start();
  // };

  // const onSubmit = async (values, actions) => {
  //   const { search } = values;
  //   if (search.trim()) {
  //     const decodedSearchQuery = decodeURIComponent(search.trim());
  //     navigate(`/search/${decodedSearchQuery}`);
  //   } else {
  //     navigate("/");
  //   }
  // };

//   const formik = useFormik({
//     initialValues: {
//       search: "",
//     },
//     validationSchema: validationSchema,
//     onSubmit,
//   });

//   useEffect(() => {
//     if (isListening && !formik.isSubmitting) {
//       handleSpeechRecognition();
//     }
//   }, [isListening]);

//   useEffect(() => {
//     if (!isListening && recognizedText) {
//       formik.setFieldValue("search", recognizedText, true);
//       formik.handleSubmit();
//     }
//   }, [isListening]);

//   return (
//     <form onSubmit={formik.handleSubmit} style={{ width: "50%" }}>
//       <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
//         <InputBase
//           sx={{ bgcolor: "white", padding: "10px" }}
//           fullWidth={true}
//           id="search"
//           name="search"
//           label="search"
//           placeholder="ex: developer, front end"
//           value={formik.values.search}
//           onBlur={formik.handleBlur}
//           onChange={formik.handleChange}
//           error={formik.touched.search && Boolean(formik.errors.search)}
//         />
//         <Button
//           color="primary"
//           variant="contained"
//           type="submit"
//           disabled={formik.isSubmitting}
//         >
//           Search
//         </Button>
//         <Button
//           color="primary"
//           variant="contained"
//           onClick={() => setIsListening(!isListening)}
//         >
//           {isListening ? "Stop Listening" : "Start Listening"}
//         </Button>
//       </Box>
//       <Box component="span" sx={{ color: "orange" }}>
//         {formik.touched.search && formik.errors.search}
//       </Box>
//       <Box component="div" sx={{ marginTop: "10px" }}>
//         Recognized Text: {recognizedText}
//       </Box>
//     </form>
//   );
// };

// export default SearchInputEl;
import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import { Box, Button, InputBase } from "@mui/material";
import { useNavigate } from "react-router-dom";

const validationSchema = yup.object({
  search: yup.string("Enter your search query").required("This field cannot be empty"),
});

const SearchInputEl = () => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");

  const handleSpeechRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setRecognizedText(""); 
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setRecognizedText((prevText) => prevText + transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const onSubmit = async (values, actions) => {
    const { search } = values;
    if (search.trim()) {
      const decodedSearchQuery = decodeURIComponent(search.trim());
      navigate(`/search/${decodedSearchQuery}`);
    } else {
      navigate("/");
    }
  };

  const formik = useFormik({
    initialValues: {
      search: "",
    },
    validationSchema: validationSchema,
    onSubmit,
  });

  const handleSearchChange = (event) => {
    formik.handleChange(event);
    formik.handleSubmit();
  };

  useEffect(() => {
    if (isListening && !formik.isSubmitting) {
      handleSpeechRecognition();
    }
  }, [isListening]);

  useEffect(() => {
    if (!isListening && recognizedText) {
      formik.setFieldValue("search", recognizedText, true);
      formik.handleSubmit();
    }
  }, [isListening]);

  return (
    <form onSubmit={formik.handleSubmit} style={{ width: "50%" }}>
      <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <InputBase
          sx={{ bgcolor: "white", padding: "10px" }}
          fullWidth={true}
          id="search"
          name="search"
          label="search"
          placeholder="ex: developer, front end"
          value={formik.values.search}
          onBlur={formik.handleBlur}
          onChange={handleSearchChange} // Use the custom onChange event handler
          error={formik.touched.search && Boolean(formik.errors.search)}
        />
        <Button
          color="primary"
          variant="contained"
          type="submit"
          disabled={formik.isSubmitting}
        >
          Search
        </Button>
        <Button
          color="primary"
          variant="contained"
          onClick={() => setIsListening(!isListening)}
        >
          {isListening ? "Stop Listening" : "Start Listening"}
        </Button>
      </Box>
      <Box component="span" sx={{ color: "orange" }}>
        {formik.touched.search && formik.errors.search}
      </Box>
      <Box component="div" sx={{ marginTop: "10px" }}>
        Recognized Text: {recognizedText}
      </Box>
    </form>
  );
};

export default SearchInputEl;
