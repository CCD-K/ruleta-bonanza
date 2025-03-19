
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  initialMinutes: number;
  onComplete?: () => void;
}

const CountdownTimer = ({ initialMinutes, onComplete }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onComplete) onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex items-center gap-2 bg-red-500/80 text-white p-3 rounded-lg font-bold animate-pulse">
      <Clock className="h-5 w-5" />
      <span>
        {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
      </span>
      <span className="text-sm">
        {timeLeft > 0 ? "Te queda este tiempo para canjear. ¡No pierdas esta oportunidad!" : "¡Tiempo agotado!"}
      </span>
    </div>
  );
};

export default CountdownTimer;
