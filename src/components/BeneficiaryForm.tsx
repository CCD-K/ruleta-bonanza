
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface BeneficiaryFormProps {
  name: string;
  setName: (name: string) => void;
  dni: string;
  setDni: (dni: string) => void;
  isSubmitting: boolean;
  mustSpin: boolean;
  allowRespin: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  showConfirmation: boolean;
  handleConfirmation: () => void;
  lastWinner: DisplayBeneficiary | null;
}

export interface DisplayBeneficiary {
  id?: string;
  name: string;
  dni: string;
  date: string;
  prize?: string;
  created_at?: string;
}

const BeneficiaryForm = ({
  name,
  setName,
  dni,
  setDni,
  isSubmitting,
  mustSpin,
  allowRespin,
  handleSubmit,
  showConfirmation,
  handleConfirmation,
  lastWinner,
}: BeneficiaryFormProps) => {
  return (
    <div className="glass rounded-xl p-6 space-y-6 h-fit">
      <h2 className="text-2xl font-bold text-center mb-6 text-white">
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
        <div className="space-y-2 text-white">
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
          {isSubmitting
            ? "Procesando..."
            : allowRespin
            ? "¡Vuelve a Girar!"
            : "Registrar y Girar"}
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

      <WinnerDisplay lastWinner={lastWinner} />

      <LogoRow />
    </div>
  );
};

const WinnerDisplay = ({ lastWinner }: { lastWinner: DisplayBeneficiary | null }) => {
  if (!lastWinner) return null;

  return (
    <div className="mt-6 p-6 bg-cyan-300/10 backdrop-blur-md rounded-lg border border-white 50 shadow-xl animate-fade-in">
      <h3 className="font-bold text-xl mb-3 text-white">¡Último Ganador!</h3>
      <div className="space-y-2">
        <p className="text-white">
          <span className="font-semibold">Nombre:</span> {lastWinner.name}
        </p>
        <p className="text-white">
          <span className="font-semibold">DNI:</span> {lastWinner.dni}
        </p>
        <p className="text-white">
          <span className="font-semibold">Fecha:</span> {lastWinner.date}
        </p>
        <div className="mt-4 py-3 px-4 bg-yellow-400/80 rounded-lg border border-primary/20">
          <p className="font-bold text-lg text-white text-center">
            {lastWinner.prize}
          </p>
        </div>
      </div>
    </div>
  );
};

const LogoRow = () => {
  return (
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
  );
};

export default BeneficiaryForm;
