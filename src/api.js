import axios from "axios";

const API = axios.create({
    baseURL: "https://batloung-farm-api-vyh0.onrender.com/api"
});

export default API;
