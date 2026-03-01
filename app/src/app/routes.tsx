import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { CreateReview } from "./pages/CreateReview";
import { PastReviews } from "./pages/PastReviews";
import { MyDocuments } from "./pages/MyDocuments";
import { MyDetails } from "./pages/MyDetails";
import { HospitalDetail } from "./pages/HospitalDetail";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "create-review",
        element: <CreateReview />,
      },
      {
        path: "past-reviews",
        element: <PastReviews />,
      },
      {
        path: "my-reviews",
        element: <PastReviews />,
      },
      {
        path: "my-documents",
        element: <MyDocuments />,
      },
      {
        path: "my-details",
        element: <MyDetails />,
      },
      {
        path: "hospital/:id",
        element: <HospitalDetail />,
      },
    ],
  },
]);
