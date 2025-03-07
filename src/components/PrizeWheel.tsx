
import { Wheel } from "react-custom-roulette";

interface PrizeWheelProps {
  mustSpin: boolean;
  prizeNumber: number;
  onStopSpinning: () => void;
}

interface PrizeData {
  option: string;
  number: number;
}

export const prizes: PrizeData[] = [
  { option: "S/50.00  DE DESCT ADICIONAL", number: 1 },
  { option: "S/150.00 DESCT EN TU PROXIMO CURSO", number: 2 },
  { option: "UN CURSO DE REGALO CON CERTIFICADO DIGITAL", number: 3 },
  { option: "ENVIO DE CERTIFICADO GRATUITO CCD", number: 4 },
  { option: "S/30.00  DESCT EN TU CERTIFICADO ACREDITADO", number: 5 },
  { option: "ACCESO A UN AÑO AL AULA VIRTUAL", number: 6 },
  { option: "VUELVE A GIRAR", number: 7 },
  { option: "DOS CURSOS DE REGALO (NO INCLUYE CERTIFICADO)", number: 8 },
  { option: "PERDISTE", number: 9 },
];

export const colors = [
  "#230424", // Azul
  "#00EADE", // Turquesa
  "#3a5070", // Azul oscuro
  "#3185F7", // Azul
  "#00EADE", // Turquesa
  "#3a5070", // Azul oscuro
  "#00EADE", // Turquesa
  "#3185F7", // Azul
  "#3a5070", // Azul oscuro
  "#FF9500", // Naranja brillante
  "rgba(35, 4, 36, 0.7)", // Púrpura
];

const PrizeWheel = ({ mustSpin, prizeNumber, onStopSpinning }: PrizeWheelProps) => {
  const radialGradient = "radial-gradient(circle, #8B5CF6 0%, #1A1F2C 100%)";
  
  const wheelContainerStyle = {
    position: "relative" as const,
    perspective: "1000px",
    transformStyle: "preserve-3d" as const,
    transition: "transform 0.5s ease",
  };

  const wheelStyle = {
    transform: mustSpin ? "rotateY(10deg) rotateX(5deg)" : "rotateY(25deg) rotateX(10deg)",
    boxShadow: "0 20px 30px #00d1e066",
    borderRadius: "50%",
    transition: "transform 0.3s ease",
    background: radialGradient,
  };

  const data = prizes.map((prize, index) => ({
    option: prize.number.toString(),
    backgroundColor: colors[index % colors.length],
    style: { fontSize: 24, fontWeight: "bold" },
  }));

  return (
    <div style={wheelContainerStyle}>
      <div 
        style={wheelStyle}
        className="relative hover:scale-105 transition-transform"
      >
        <Wheel
          mustStartSpinning={mustSpin}
          prizeNumber={prizeNumber}
          data={data}
          onStopSpinning={onStopSpinning}
          textColors={["#ffffff"]}
          backgroundColors={colors}
          outerBorderColor="#c50063"
          outerBorderWidth={6}
          innerBorderColor="#0c97c2"
          innerBorderWidth={20}
          radiusLineColor="#810ece"
          radiusLineWidth={4}
          fontSize={24}
          perpendicularText={true}
          textDistance={85}
        />
        <div className="absolute inset-0 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.3)] pointer-events-none"></div>
        <div className="absolute inset-0 rounded-full ring-4 ring-black ring-opacity-20 pointer-events-none"></div>
      </div>
    </div>
  );
};

export default PrizeWheel;
