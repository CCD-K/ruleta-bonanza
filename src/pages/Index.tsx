
import { useState, useEffect } from "react";
import { Wheel } from "react-custom-roulette";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface DisplayBeneficiary {
  id?: string;
  name: string;
  dni: string;
  date: string;
  prize?: string;
  created_at?: string;
}

interface DBBeneficiary {
  id: string;
  name: string;
  dni: string;
  date: string;
  created_at: string;
}

interface DBBeneficiaryPrize extends DBBeneficiary {
  prize: string;
}

const prizes = [
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

// Define the allowed prize numbers
const allowedPrizeNumbers = [0, 1, 4, 6, 8]; // Corresponds to prizes 1, 2, 5, 7, 9

const Index = () => {
  const [name, setName] = useState("");
  const [dni, setDni] = useState("");
  const [beneficiaries, setBeneficiaries] = useState<DisplayBeneficiary[]>([]);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [currentBeneficiary, setCurrentBeneficiary] =
    useState<DisplayBeneficiary | null>(null);
  const [lastWinner, setLastWinner] = useState<DisplayBeneficiary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allowRespin, setAllowRespin] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const fetchBeneficiaries = async () => {
    try {
      const { data: prizeData, error: prizeError } = await supabase
        .from("beneficiary_prizes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (prizeError) throw prizeError;

      const { data: beneficiaryData, error: beneficiaryError } = await supabase
        .from("beneficiaries")
        .select("*")
        .order("created_at", { ascending: false });

      if (beneficiaryError) throw beneficiaryError;

      if (beneficiaryData) {
        const displayBeneficiaries = beneficiaryData.map(
          (b: DBBeneficiary) => ({
            ...b,
            prize:
              prizeData && prizeData[0]?.dni === b.dni
                ? prizeData[0].prize
                : undefined,
          })
        );
        setBeneficiaries(displayBeneficiaries);

        if (prizeData && prizeData.length > 0) {
          setLastWinner(prizeData[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching beneficiaries:", error);
      toast({
        title: "Error",
        description: "Error al cargar los beneficiarios",
        variant: "destructive",
      });
    }
  };

  const checkExistingDNI = async (dni: string) => {
    try {
      const [beneficiaryResult, prizeResult] = await Promise.all([
        supabase
          .from("beneficiaries")
          .select("dni")
          .eq("dni", dni)
          .maybeSingle(),
        supabase
          .from("beneficiary_prizes")
          .select("dni")
          .eq("dni", dni)
          .maybeSingle(),
      ]);

      if (beneficiaryResult.error) throw beneficiaryResult.error;
      if (prizeResult.error) throw prizeResult.error;

      return beneficiaryResult.data !== null || prizeResult.data !== null;
    } catch (error) {
      console.error("Error checking DNI:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!name || !dni) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (!allowRespin) {
        const exists = await checkExistingDNI(dni);
        if (exists) {
          toast({
            title: "Error",
            description: "Este DNI ya ha sido registrado",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      const newBeneficiary: DisplayBeneficiary = {
        name: name.trim(),
        dni: dni.trim(),
        date: format(new Date(), "dd/MM/yyyy"),
      };

      setCurrentBeneficiary(newBeneficiary);
      
      // Get a random index from the allowed prize numbers array
      const randomIndex = Math.floor(Math.random() * allowedPrizeNumbers.length);
      const newPrizeNumber = allowedPrizeNumbers[randomIndex];
      
      setPrizeNumber(newPrizeNumber);
      setMustSpin(true);
      setAllowRespin(false);
      setShowConfirmation(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Error al procesar el registro",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveBeneficiary = async (beneficiary: DisplayBeneficiary) => {
    try {
      const beneficiaryData = {
        name: beneficiary.name,
        dni: beneficiary.dni,
        date: beneficiary.date,
      };

      const prizeBeneficiaryData = {
        ...beneficiaryData,
        prize: beneficiary.prize!,
      };

      const [{ error: beneficiaryError }, { error: prizeError }] =
        await Promise.all([
          supabase.from("beneficiaries").insert([beneficiaryData]),
          supabase.from("beneficiary_prizes").insert([prizeBeneficiaryData]),
        ]);

      if (beneficiaryError) throw beneficiaryError;
      if (prizeError) throw prizeError;

      await fetchBeneficiaries();
      return true;
    } catch (error) {
      console.error("Error saving beneficiary:", error);
      throw error;
    }
  };

  const handleStopSpinning = async () => {
    setMustSpin(false);
    if (!currentBeneficiary) return;

    try {
      const prizeWon = prizes[prizeNumber].option;
      const beneficiaryWithPrize = {
        ...currentBeneficiary,
        prize: prizeWon,
      };

      if (prizes[prizeNumber].number === 7) {
        setAllowRespin(true);
        toast({
          title: "¡Vuelve a girar!",
          description: "Tienes otra oportunidad, puedes volver a girar",
          variant: "default",
        });
      } else if (prizes[prizeNumber].number === 9) {
        await saveBeneficiary(beneficiaryWithPrize);
        setLastWinner(beneficiaryWithPrize);
        setShowConfirmation(true);
        toast({
          title: "No te desanimes",
          description: "Aun puedes potenciar tu perfil profesional",
          variant: "default",
        });
      } else {
        await saveBeneficiary(beneficiaryWithPrize);
        setLastWinner(beneficiaryWithPrize);
        setShowConfirmation(true);
        toast({
          title: "¡Felicitaciones!",
          description: `Has ganado: ${prizeWon}`,
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar el beneficiario",
        variant: "destructive",
      });
    }
  };

  const handleConfirmation = () => {
    if (!currentBeneficiary) return;
    
    const phoneNumber = "51908841254";
    const message = encodeURIComponent(
      `��Hola! Soy ${currentBeneficiary.name} con DNI ${currentBeneficiary.dni}. He ganado "${lastWinner?.prize}" en la ruleta de premios y me gustaría canjear mi Beneficio.`
    );
    
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
    
    setName("");
    setDni("");
    setCurrentBeneficiary(null);
    setShowConfirmation(false);
  };

  const colors = [
    "#00eade7a", // Turquesa
    "#41accca0", 
    "#00eade7a", // Turquesa
    "#41accca0", 
    "#00eade7a", // Turquesa
    "#41accca0", 
    "#00eade7a", // Turquesa
    "#41accca0", 
    "#8780c246", //
  ];

  // Changed to remove the blue/cyan gradient
  const radialGradient = "radial-gradient(circle, #ffffff80 80%, #ffffff80 100%)";

  const data = prizes.map((prize, index) => ({
    option: prize.number.toString(),
    backgroundColor: colors[index % colors.length],
    style: { fontSize: 30, fontWeight: "bold" },
  }));

  const wheelContainerStyle = {
    position: "relative" as const,
    perspective: "1000px",
    transformStyle: "preserve-3d" as const,
    transition: "transform 0.5s ease",
  };

  const wheelStyle = {
    transform: mustSpin ? "rotateY(10deg) rotateX(5deg)" : "rotateY(25deg) rotateX(10deg)",
    // Removed the cyan box-shadow
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
    borderRadius: "15%",
    transition: "transform 0.3s ease",
    background: radialGradient,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass rounded-xl p-6 space-y-6 h-fit ">
          <h2 className="text-2xl font-bold text-center mb-6 text-white  ">
            Registro de Beneficiario
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 text-white">
              <Label htmlFor="name" className="">
                NOMBRE COMPLETO
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/50"
                placeholder="Ingrese nombre completo"
                disabled={isSubmitting || (mustSpin && !allowRespin)}
              />
            </div>
            <div className="space-y-2 text-white"  >
              <Label htmlFor="dni" className="">
                DNI
              </Label>
              <Input
                id="dni"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                className="bg-white/50"
                placeholder="Ingrese DNI"
                maxLength={8}
                disabled={isSubmitting || (mustSpin && !allowRespin)}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || (mustSpin && !allowRespin)}
            >
              {isSubmitting ? "Procesando..." : allowRespin ? "¡Vuelve a Girar!" : "Registrar y Girar"}
            </Button>
          </form>

          {showConfirmation && (
            <div className="mt-4 animate-pulse">
              <Button 
                onClick={handleConfirmation} 
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold"
              >
                CONFIRMAR Y CONTACTAR POR WHATSAPP
              </Button>
            </div>
          )}

          {lastWinner && (
            <div className="mt-6 p-6 bg-cyan-300/10 backdrop-blur-md rounded-lg border border-white 50 shadow-xl animate-fade-in">
              <h3 className="font-bold text-xl mb-3 text-white">¡Último Ganador!</h3>
              <div className="space-y-2">
                <p className="text-white"><span className="font-semibold">Nombre:</span> {lastWinner.name}</p>
                <p className="text-white"><span className="font-semibold">DNI:</span> {lastWinner.dni}</p>
                <p className="text-white"><span className="font-semibold">Fecha:</span> {lastWinner.date}</p>
                <div className="mt-4 py-3 px-4  bg-yellow-400/80 rounded-lg border border-primary/20">
                  <p className="font-bold text-lg text-white text-center">
                    {lastWinner.prize}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 items-center justify-center mx-auto">
            <img
              src="https://pub-9d2abfa175714e64aed33b90722a9fd5.r2.dev/Multimedia/Imagen/Ccd/Logos/kevin3.png"
              alt="Centro de Capacitación y Desarrollo"
              className="w-[9rem] transform transition-transform duration-300 group-hover:scale-110"
            />
            <img
              src="https://pub-9d2abfa175714e64aed33b90722a9fd5.r2.dev/Multimedia/Imagen/Ccd/Logos/kevin2.png"
              alt="Centro de Capacitación y Desarrollo"
              className="w-[9rem] transform transition-transform duration-300 group-hover:scale-110"
            />
            <img
              src="https://pub-9d2abfa175714e64aed33b90722a9fd5.r2.dev/Multimedia/Imagen/Ccd/Logos/kevin.png"
              alt="Centro de Capacitación y Desarrollo"
              className="w-[20rem] transform transition-transform duration-300 group-hover:scale-110"
            />
          </div>
        </div>

        <div className="glass rounded-xl p-6 flex flex-col items-center justify-center ">
          <div className="mb-6" style={wheelContainerStyle}>
            <div 
              style={wheelStyle}
              className="relative hover:scale-105 transition-transform"
            >
              <Wheel
                mustStartSpinning={mustSpin}
                prizeNumber={prizeNumber}
                data={data}
                onStopSpinning={handleStopSpinning}
                textColors={["#ffffff"]}
                backgroundColors={colors}
                outerBorderColor="#ffffff"
                outerBorderWidth={6}
                innerBorderColor="#00ffea"
                innerBorderWidth={20}
                radiusLineColor="#ffffff"
                radiusLineWidth={4}
                fontSize={38}
                perpendicularText={true}
                textDistance={75}
                pointerProps={{ style: { fill: "#FFFFFF" } }}
              />
              <div className="absolute inset-0 rounded-full shadow-[0_0_0.2px_rgba(255, 0, 0, 0.3)] pointer-events-none"></div>
              <div className="absolute inset-0 rounded-full ring-4 ring-black ring-opacity-15 pointer-events-none"></div>
            </div>
          </div>
          <div className="w-full max-w-md mt-6">
            <h3 className="text-xl   font-bold mb-5 text-white ">Premios por Aquirir un curso:</h3>
            <ul className="space-y-2 grid grid-cols-1  gap-2">
              {prizes.map((prize, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 p-3 text-white rounded-lg shadow-md border-4 border-blue-500 transform transition-transform hover:scale-105"
                  style={{
                    boxShadow: "0 4px 6px rgba(0, 255, 255, 0.603), inset 0 5px 0 rgba(90, 247, 142, 0.3)",
                  }}
                >
                  <span className="font-bold text-sm">{prize.number}.</span>
                  <span className="text-sm md:text-base font-medium">{prize.option}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
