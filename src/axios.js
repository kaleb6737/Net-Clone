import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://api.themoviedb.org/3', // replace with your API's base URL
});

export default instance;
