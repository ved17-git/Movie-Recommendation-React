import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Box from '@mui/material/Box';
import Rating from '@mui/material/Rating';
import Typography from '@mui/material/Typography';
import WestIcon from '@mui/icons-material/West';
import { Button } from "@heroui/button";
import toast, { Toaster } from 'react-hot-toast';

interface Genre {
  id: number;
  name: string;
}

interface CastMember {
  id: number;
  name: string;
  character: string;
}

interface MovieDetails {
  id: number;
  title: string;
  poster_path: string;
  overview: string;
  genres: Genre[];
  credits: {
    cast: CastMember[];
  };
}

interface ContentBased {
  cast: string;
  director: string;
  genre: string;
  language: string;
  movie_id: string;
  movie_name: string;
  overview: string;
  sr_no: number;
  year: number;
}

function MovieInfo() {
  const { id } = useParams<{ id: string }>(); // IMDb ID passed via the route parameters
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [contentRecommendations, setContentRecommendations] = useState<ContentBased[]>([]);
  const [collaberativeBased, setCollaberativeBased] = useState<ContentBased[]>([]);

  const [userId, setUserId] = useState<number>(0);
  const [rating, setRating] = useState<number>(0);

  const [loadingType, setLoadingType] = useState<null | 'content' | 'collaborative' | 'rate'>(null);

  const navigate = useNavigate();

  // Reset state when movie ID changes
  useEffect(() => {
    setRating(0);
    setUserId(0);
    setContentRecommendations([]);
    setCollaberativeBased([]);
    setLoading(true);
    setError(null);
    
    // Scroll to the top when navigating to a new movie
    window.scrollTo(0, 0);
    
    fetchMovieDetails();
  }, [id]); // This effect runs whenever the ID changes

  const fetchMovieDetails = async () => {
    try {
      const apiKey = "91a7bc615e78124694205aa0a77e27f0";
      const findMovieUrl = `https://api.themoviedb.org/3/find/${id}?api_key=${apiKey}&language=en-US&external_source=imdb_id`;
      const findMovieResponse = await fetch(findMovieUrl);
      const findMovieData = await findMovieResponse.json();

      const movie = findMovieData.movie_results[0];
      if (!movie) {
        setError("Movie not found.");
        setLoading(false);
        return;
      }
      const movieId = movie.id;

      // Fetch movie details and cast using movie_id
      const movieDetailsUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=en-US&append_to_response=credits`;
      const movieDetailsResponse = await fetch(movieDetailsUrl);
      const movieDetails: MovieDetails = await movieDetailsResponse.json();

      setMovie(movieDetails);
      setLoading(false);
    } catch {
      setError("Error fetching movie details.");
      setLoading(false);
    }
  };

  const contentBased = async () => {
    try {
      setLoadingType("content");
      const res = await fetch(`https://movie-recommendation-flask.onrender.com/recommendations/content/${id}`);
      const ans = await res.json();
      setLoadingType(null);
      setContentRecommendations(ans);
    } catch {
      toast.error("Error fetching content-based recommendations");
      setLoadingType(null);
    }
  };

  const Collaberative = async () => {
    try {
      if (!userId || !rating) {
        toast.error("Enter UserID and Rating");
        return;
      }
      setLoadingType("collaborative");
      const res = await fetch(`https://movie-recommendation-flask.onrender.com/recommendations/collaborative/${userId}`);
      const ans = await res.json();
      setLoadingType(null);
      console.log(ans);
      setCollaberativeBased(ans);
    } catch (error) {
      console.log(error);
      toast.error("Rate the movie");
      setLoadingType(null);
    }
  };

  const handleSubmit = async () => {
    const data = {
      user_id: userId,
      movie_id: id,
      rating
    };
    
    if (!data.user_id || !data.rating) {
      toast.error("User ID and Rating are required!");
      return;
    }

    try {
      setLoadingType("rate");
      const response = await fetch('https://movie-recommendation-flask.onrender.com/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      setLoadingType(null);
      toast.success("Rating Submitted!");
      console.log('Rating submitted successfully:', result);
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error("Failed to submit rating");
      setLoadingType(null);
    }
  };

  const navigateToMovie = (movieId: string) => {
    navigate(`/${movieId}`);
  };

  if (loading) {
    return (
      <div className="grid place-items-center mt-10">
        <h1 className="bg-blue-500 w-fit p-3 rounded-xl text-white">Loading...</h1>
      </div>
    );
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <>
      <Toaster position="bottom-right" />

      <div>
        {movie ? (
          <>
            <div className="flex gap-10 md:flex-col md:px-[8vh] px-[26vh] w-full items-center bg-slate-200 py-10 shadow-xl relative sm:px-[4vh] font-inter">
              <button
                className=" top-0 left-0 m-3 bg-zinc-700 text-white p-2 rounded-xl fixed sm:text-xs z-50"
                onClick={() => navigate('/')}>
                <WestIcon className="mr-1" />
                Home
              </button>
              <div className="w-[25%] md:w-[50%] sm:w-[85%] mt-12">
                <img
                  src={`https://image.tmdb.org/t/p/original${movie.poster_path}`}
                  alt={movie.title}
                  className="w-[100%] rounded-xl"
                />
              </div>

              <div className="w-[50%] py-4 sm:w-[100%] sm:mt-[-4vh]">
                <div className="space-y-5">
                  <h1 className="text-3xl font-semibold sm:text-xl">{movie.title}</h1>
                  <p className="sm:text-xs">{movie.overview}</p>
                </div>

                <h2 className="text-xl font-medium mt-5">Genres</h2>
                <ul className="flex gap-5 sm:gap-2">
                  {movie.genres.map((genre) => (
                    <li
                      key={genre.id}
                      className="bg-zinc-200 border-[1px] border-zinc-300 p-2 rounded-xl sm:text-xs "
                    >
                      {genre.name}
                    </li>
                  ))}
                </ul>

                <div>
                  <h2 className="text-xl font-medium mt-5">Cast</h2>
                  <ul className="sm:text-[2vh]">
                    {movie.credits.cast.slice(0, 5).map((castMember) => (
                      <li key={castMember.id}>
                        {castMember.name} as {castMember.character}
                      </li>
                    ))}
                  </ul>
                </div>

                <Box sx={{ '& > legend': { mt: 2 } }}>
                  <Typography component="legend" className="font-semibold font-inter">
                    Rate this movie
                  </Typography>
                  <Rating
                    name="simple-controlled"
                    value={rating}
                    onChange={(_, newValue) => {
                      setRating(newValue || 0);
                    }}
                  />
                </Box>

                <div className="mt-6 font-inter">
                  <label htmlFor="id">User Id</label> <br />
                  <input
                    type="number"
                    placeholder="Add user id"
                    id="id"
                    value={userId || ""}
                    className="bg-zinc-200 p-2 rounded-xl"
                    onChange={(e) => setUserId(Number(e.target.value))}
                  />
                </div>

                <Button 
                  isLoading={loadingType === "rate"} 
                  color="primary" 
                  className="p-2 mt-4 font-inter" 
                  onPress={handleSubmit}
                >
                  Submit Rating
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div>No movie details found.</div>
        )}
      </div>

      <div className="flex items-center justify-center gap-10 pb-14 font-inter">
        <div className="mt-10 text-center">
          <Button
            onPress={contentBased}
            className="p-2"
            color="primary"
            isLoading={loadingType === "content"}
          >
            Content Based
          </Button>
        </div>

        <div className="text-center mt-10">
          <Button
            onPress={Collaberative}
            className="p-2"
            color="primary"
            isLoading={loadingType === "collaborative"}
          >
            Collaborative Based
          </Button>
        </div>
      </div>

      <div className="flex pb-5 w-[100%] font-inter">
        <div className="grid grid-cols-2 gap-10 px-[6vh] w-[50%] border-r-2 border-zinc-200 sm:grid-cols-1 sm:px-[2vh] sm:w-[100%] sm:gap-1  ">
          {contentRecommendations.map((item) => (
            <div
              key={item.movie_id}
              className="flex justify-between bg-zinc-800 mt-5 p-10 rounded-xl cursor-pointer hover:scale-105 transition ease-in-out duration-500 sm:p-5 "
              onClick={() => navigateToMovie(item.movie_id)}
            >
              <div className="space-y-6 text-white shadow-2xl">
                <div>
                  <h1 className="text-2xl sm:text-[3vh] font-bold sm:leading-5">{item.movie_name}</h1>
                  <h1 className="sm:text-xs sm:mt-2">{item.year}</h1>
                </div>
                <h1 className="sm:text-xs">{item.genre}</h1>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-10 px-[6vh] w-[50%] border-r-2 border-zinc-200 sm:grid-cols-1 sm:px-[2vh] sm:w-[100%] sm:gap-1  ">
          {collaberativeBased.map((item) => (
            <div
              key={item.movie_id}
              className="flex justify-between bg-zinc-800 mt-5 p-10 rounded-xl cursor-pointer hover:scale-105 transition ease-in-out duration-500 sm:p-5 "
              onClick={() => navigateToMovie(item.movie_id)}
            >
              <div className="space-y-6 text-white shadow-2xl">
                <div>
                  <h1 className="text-2xl sm:text-[3vh] font-bold sm:leading-5">{item.movie_name}</h1>
                  <h1 className="sm:text-xs sm:mt-2">{item.year}</h1>
                </div>
                <h1 className="sm:text-xs">{item.genre}</h1>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default MovieInfo;