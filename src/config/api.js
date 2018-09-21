import axios from "axios";

const instance = axios.create({
  baseURL: "https://eos.empark.com/api/v1.0",
  timeout: 5000,
  headers: {
    "Content-type": "application/json; charset=utf-8",
    "X-EOS-CLIENT-TOKEN": "2463bc87-6e92-480e-a56b-4260ff8b6a38"
  }
});

const handleError = error => {
  switch (error.response.status) {
    case 401:
      if (
        error.response.data.message ===
          "Via Verde - Auth failed. Error code: -8, Error Message: Credenciais inválidas!" &&
        error.response.data.type === "authenticationFailed"
      ) {
        console.log("Invalid credentials!");
      } else if (
        error.response.data.type === "authenticationFailed" &&
        error.response.data.message === "invalid token"
      ) {
        console.log("Invalid Token");
        delete instance.defaults.headers.common["X-EOS-USER-TOKEN"];
      } else {
        console.log(error);
      }

      break;
    default:
      console.log("ERROR on request");
      console.log(error.response.data);

      if (error.response.data.type === "accNotFound") {
        console.log("Account not found!");
      }

      break;
  }

  // TODO: Look into this!
  return Promise.reject(error);
};

instance.interceptors.response.use(response => response, handleError);

export default instance;
