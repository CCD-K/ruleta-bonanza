
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import BeneficiaryForm, { DisplayBeneficiary } from "@/components/BeneficiaryForm";
import PrizeWheel, { prizes } from "@/components/PrizeWheel";
import PrizeList from "@/components/PrizeList";

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

const Index = () => {
  const [name, setName] = useState("");
  const [dni, setDni] = useState("");
  const [beneficiaries, setBeneficiaries] = useState<DisplayBeneficiary[]>([]);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [currentBeneficiary, setCurrentBeneficiary] = useState<DisplayBeneficiary | null>(null);
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
      const newPrizeNumber = Math.floor(Math.random() * prizes.length);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <BeneficiaryForm
          name={name}
          setName={setName}
          dni={dni}
          setDni={setDni}
          isSubmitting={isSubmitting}
          mustSpin={mustSpin}
          allowRespin={allowRespin}
          handleSubmit={handleSubmit}
          showConfirmation={showConfirmation}
          handleConfirmation={handleConfirmation}
          lastWinner={lastWinner}
        />

        <div className="glass rounded-xl p-6 flex flex-col items-center justify-center text-black">
          <div className="mb-6">
            <PrizeWheel
              mustSpin={mustSpin}
              prizeNumber={prizeNumber}
              onStopSpinning={handleStopSpinning}
            />
          </div>
          <PrizeList />
        </div>
      </div>
    </div>
  );
};

export default Index;
