import React from "react";
import Image from "next/image";
import Link from "next/link";

const SpoilerBarCard = ({ player }) => {
  const nameMap = {
    afp: "AFP",
    winner: "Winner",
    hoh: "HoH",
    second: "2nd Place",
    pov: "Veto",
    jury: "Jury",
    nom: "Nom",
    evic: "Evicted"
  };

  const statusColor = player.status[0];

  player.link;

  const statusDisplay = player.status
    .map(place => {
      return nameMap[place] || place; // Look up place in nameMap or use the original place if not found
    })
    .join(", "); // Join the mapped values with a comma and space

  return (
    <div className={`mx-1 text-xs text-center ${statusColor}`}>
      <Link href={player.link}>
        <div className="w-8 md:w-12 flex justify-center mx-auto">
          <Image src={player.image} alt={player.nick ? player.nick : player.first_name} width={100} height={100} className="rounded-xl w-full" />
        </div>
        <div className="font-primaryHeader">{player.nick ? player.nick : player.first_name}</div>
        <h4 className={`text-xs font-mainHead text-center !leading-3 md:!leading-4 tracking-tighter`}>{statusDisplay}</h4>
      </Link>
    </div>
  );
};

export default SpoilerBarCard;
