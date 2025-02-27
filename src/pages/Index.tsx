import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wheel } from "react-custom-roulette";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface DisplayBeneficiary {
  id?: string;
  name: string;
  dni: string;
  date: string;
  prize?: string;
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
  { option: "Prize 1" },
  { option: "Prize 2" },
  { option: "Prize 3" },
  { option: "Prize 4" },
  { option: "Prize 5" },
];

export default function Index() {
  const [name, setName] = useState("");
  const [dni, setDni] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [beneficiaries, setBeneficiaries] = useState<DisplayBeneficiary[]>([]);
  const [lastWinner, setLastWinner] = useState<DisplayBeneficiary | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkSession();
    fetchBeneficiaries();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();
      
    if (error) {
      console.error('Error fetching role:', error);
      return;
    }
    
    setIsAdmin(data?.role === 'admin');
  };

  const fetchBeneficiaries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("beneficiaries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setBeneficiaries(
        data.map((beneficiary) => ({
          id: beneficiary.id,
          name: beneficiary.name,
          dni: beneficiary.dni,
          date: beneficiary.date,
        }))
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkExistingDNI = async (dni: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("beneficiaries")
        .select("*")
        .eq("dni", dni);
      if (error) throw error;
      return data.length > 0;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return true;
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dniExists = await checkExistingDNI(dni);
      if (dniExists) {
        toast({
          title: "Error",
          description: "DNI already exists",
          variant: "destructive",
        });
        return;
      }
      const { data, error } = await supabase.from("beneficiaries").insert([
        {
          name,
          dni,
          date,
        },
      ]);
      if (error) throw error;
      fetchBeneficiaries();
      setName("");
      setDni("");
      toast({
        title: "Success",
        description: "Beneficiary added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSpinClick = async () => {
    setLoading(true);
    const newPrizeNumber = Math.floor(Math.random() * prizes.length);
    setPrizeNumber(newPrizeNumber);
    setMustSpin(true);

    const winner = beneficiaries[Math.floor(Math.random() * beneficiaries.length)];

    setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("beneficiary_prizes")
          .insert([
            {
              name: winner.name,
              dni: winner.dni,
              date: winner.date,
              prize: prizes[prizeNumber].option,
            },
          ])
          .select()
          .single();

        if (error) {
          throw error;
        }

        setLastWinner({ ...winner, prize: data.prize });
        toast({
          title: "Congratulations!",
          description: `${winner.name} won ${prizes[prizeNumber].option}!`,
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setMustSpin(false);
        setLoading(false);
      }
    }, 5000);
  };

  const saveBeneficiary = async (winner: DBBeneficiaryPrize) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("beneficiary_prizes").insert([
        {
          name: winner.name,
          dni: winner.dni,
          date: winner.date,
          prize: winner.prize,
        },
      ]);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Beneficiary saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl mb-4">Access Denied</h1>
        <p className="mb-4">You need admin privileges to access this page.</p>
        <Button onClick={handleSignOut}>Sign Out</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Beneficiary Registration</h1>
        <Button onClick={handleSignOut}>Sign Out</Button>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="text"
            placeholder="DNI"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            required
          />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="mt-4" disabled={loading}>
          Add Beneficiary
        </Button>
      </form>

      <h2 className="text-xl font-semibold mb-4">Beneficiaries</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded-md">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">DNI</th>
              <th className="py-2 px-4 border-b">Date</th>
            </tr>
          </thead>
          <tbody>
            {beneficiaries.map((beneficiary) => (
              <tr key={beneficiary.dni} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{beneficiary.name}</td>
                <td className="py-2 px-4 border-b">{beneficiary.dni}</td>
                <td className="py-2 px-4 border-b">{beneficiary.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4">
        Spin the Wheel to Win a Prize!
      </h2>
      <div className="flex flex-col items-center">
        <Wheel
          mustStartSpinning={mustSpin}
          prizeNumber={prizeNumber}
          data={prizes}
          outerBorderColor={["#f2f2f2"]}
          outerBorderWidth={5}
          innerBorderColor={["#f2f2f2"]}
          innerRadius={30}
          radiusLineWidth={5}
          radiusLineColor={["#dadada"]}
          textColors={["#ffffff"]}
          fontSize={16}
          perpendicularText={true}
          spinDuration={0.5}
          backgroundColors={[
            "#F26B5B",
            "#F28627",
            "#F2B134",
            "#F2DA63",
            "#D9F27D",
          ]}
          onStopSpinning={() => {
            setMustSpin(false);
          }}
        />
        {beneficiaries.length > 0 ? (
          <Button
            onClick={handleSpinClick}
            className="mt-4"
            disabled={mustSpin || loading}
          >
            {loading ? "Spinning..." : "Spin"}
          </Button>
        ) : (
          <p className="mt-4 text-red-500">
            Please add beneficiaries to spin the wheel.
          </p>
        )}
      </div>

      {lastWinner && (
        <div className="mt-8 p-4 border rounded-md">
          <h3 className="text-lg font-semibold">Last Winner</h3>
          <p>Name: {lastWinner.name}</p>
          <p>DNI: {lastWinner.dni}</p>
          <p>Date: {lastWinner.date}</p>
          <p>Prize: {lastWinner.prize}</p>
        </div>
      )}
    </div>
  );
}
