"use client";

import React, { useState } from "react";
import { FaToggleOn, FaToggleOff } from "react-icons/fa6";
import SpoilerBarCard from "./SpoilerBarCard";

// get static props

// old classname for the spoilerBarCard container mx-auto flex w-full max-w-6xl translate-y-0 flex-wrap   justify-center  bg-white px-0.5 py-2 shadow-md dark:bg-gray-900 lg:flex lg:w-[975px] lg:gap-4 lg:px-4

const SpoilerBar = ({ spoilerBar }) => {
  const [showBar, setShowBar] = useState(true);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  useState(() => {
    if (spoilerBar) {
      setLoadingPlayers(false);
    }
  }, [spoilerBar]);

  const playerList = spoilerBar.spoilerBar ? spoilerBar.spoilerBar : [];

  return (
    <div className="">
      <div className="w-full bg-primary500 flex justify-end items-center text-xs text-white">
        Show Spoiler Bar:
        <button onClick={() => setShowBar(!showBar)} className="py-0.5 px-2 text-white">
          {showBar ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
        </button>
      </div>

      <div className="w-full justify-center flex mb-2 z-10">
        <div className="mx-auto w-[95%] lg:w-[900px]">
          {showBar && <div className="container">{loadingPlayers ? <div>Loading players...</div> : playerList.length > 0 && playerList.map(player => <SpoilerBarCard key={player.player_id} player={player} />)}</div>}
          <div className="z-20 mx-auto flex h-1.5 w-full max-w-7xl  bg-gradient-to-b from-yellow-100 via-yellow-300 to-yellow-400 shadow "></div>
        </div>
      </div>
    </div>
  );
};

export default SpoilerBar;
