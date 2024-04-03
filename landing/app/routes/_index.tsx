import type { MetaFunction } from "@remix-run/node";
import WelcomeLogo from "~/components/WelcomeLogo";

export const meta: MetaFunction = () => {
  return [
    { title: "Introvoice" },
    { name: "description", content: "The proper way to join a voice channel" },
  ];
};

const DISCORD_BOT_LINK =
  "https://discord.com/api/oauth2/authorize?client_id=890003860096167967&permissions=8&scope=applications.commands%20bot";

export default function Index() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-950 gap-8">
      <WelcomeLogo />
      <div className="flex flex-col gap-3 text-center">
        <h1 className="text-6xl font-extrabold text-white tracking-tight">Introvoice</h1>
        <p className="text-lg text-gray-200">The proper way to join a voice channel</p>
      </div>
      <div className="flex gap-3">
        <a
          href={DISCORD_BOT_LINK}
          className="bg-white text-gray-950 font-semibold px-8 py-3 rounded-md hover:bg-gray-200 active:bg-gray-300 transition"
          target="_blank"
          rel="noopener noreferrer"
        >
          Invite to Discord
        </a>

        <a
          href="https://github.com/Newbie012/introvoice"
          className="bg-transparent text-white border border-gray-800 font-semibold px-8 py-3 rounded-md hover:bg-gray-800 active:bg-gray-700 transition"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </div>

      <span className="text-gray-500 text-sm">
        Made with boredom by{" "}
        <a
          className="text-gray-400 hover:underline"
          href="https://twitter.com/CoEliya"
          target="_blank"
          rel="noopener noreferrer"
        >
          @CoEliya
        </a>
      </span>
    </div>
  );
}
