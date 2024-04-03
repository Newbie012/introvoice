import React from "react";

const WelcomeLogo = () => {
  const { isPlaying, play } = usePlayIntro();

  return (
    <div role="button" tabIndex={0} onClick={play} onKeyDown={play}>
      <img
        data-animating={isPlaying}
        className="w-60 h-60 transition-all rounded-full cursor-pointer hover:scale-110 hover:shadow-[0_0_128px_rgba(0,0,0,0.3)] data-[animating=true]:animate-dance"
        src="logo.png"
        alt="logo"
      />
    </div>
  );
};

const AVAILABLE_INTROS = ["intro-1.mp3", "intro-2.mp3"];

function usePlayIntro() {
  const [isPlaying, setPlaying] = React.useState(false);
  const [introIdx, setIntroIdx] = React.useState(0);

  React.useEffect(() => {
    AVAILABLE_INTROS.forEach((introFileName) => void fetch(introFileName));
  }, []);

  const play = () => {
    if (isPlaying) {
      return;
    }

    const audio = new Audio(AVAILABLE_INTROS[introIdx]);

    setPlaying(true);
    setIntroIdx((introIdx + 1) % AVAILABLE_INTROS.length);

    audio.volume = 0.5;
    audio.play();
    audio.onended = () => setPlaying(false);
  };

  return { play, isPlaying };
}

export default WelcomeLogo;
