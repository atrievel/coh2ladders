import React from "react";
import { Typography } from "antd";
import { useData, useLoading } from "../../firebase";
import { Loading } from "../../components/loading";
import { validStatsTypes } from "../../coh/types";
import { useLocation } from "react-router-dom";
import CustomStatsDetails from "./custom-stats-details";
import { useFirestoreConnect } from "react-redux-firebase";
import firebaseAnalytics from "../../analytics";

const { Title } = Typography;

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

interface IProps {
  urlChanger: Function;
}

const CustomStatsGeneralDataProvider: React.FC<IProps> = ({ urlChanger }) => {
  const isLoading = useLoading("stats");
  const data: Record<string, any> = useData("stats");
  const query = useQuery();
  const statsSource: string | null = query.get("statsSource") ? query.get("statsSource") : "";

  const frequency = query.get("range") || "week";
  const timestamp = query.get("timeStamp") || "0000";
  const type = query.get("type") || "4v4";
  // const race = query.get("race") || "wermacht";

  let statDocToBeLoaded = "stats";
  if (statsSource === "top200") {
    statDocToBeLoaded = "topStats";
  }

  firebaseAnalytics.statsDisplayed(frequency, statsSource || "");

  useFirestoreConnect([
    {
      collection: "stats",
      doc: frequency,
      subcollections: [
        {
          collection: timestamp,
          doc: statDocToBeLoaded,
        },
      ],
      storeAs: "stats",
    },
  ]);

  if (isLoading) return <Loading />;

  if (!data) {
    return (
      <Title level={4} style={{ display: "flex", textAlign: "center", justifyContent: "center" }}>
        We are currently not tracking any records for the {`${frequency}`} stats on timestamp{" "}
        {`${timestamp}`}. <br />
        The statistics are run after the end of the day/week/month ~2AM UTC time.
      </Title>
    );
  }

  if (!validStatsTypes.includes(type)) {
    return (
      <Title level={4}>
        Unknown stats type {`${type}`}, valid values are {`${validStatsTypes}`}
      </Title>
    );
  }

  const specificData = {
    generalData: data[type],
    mapsData: data[type]["maps"],
  };

  return (
    <>
      <CustomStatsDetails urlChanger={urlChanger} specificData={specificData} />
    </>
  );
};

export default CustomStatsGeneralDataProvider;
