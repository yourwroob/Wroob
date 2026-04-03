import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Lightbulb, Coffee, Clock, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreateCircleFormProps {
  onSubmit: (data: {
    spot_name: string;
    spot_location?: string;
    topic: string;
    fuel_type: string;
    drop_in_time: string;
  }) => Promise<void>;
  onClose: () => void;
}

const CreateCircleForm = ({ onSubmit, onClose }: CreateCircleFormProps) => {
  const { toast } = useToast();
  const [spotName, setSpotName] = useState("");
  const [spotLocation, setSpotLocation] = useState("");
  const [topic, setTopic] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [dropInDate, setDropInDate] = useState("");
  const [dropInTime, setDropInTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!spotName.trim() || !topic.trim() || !fuelType.trim() || !dropInDate || !dropInTime) {
      toast({ title: "Missing fields", description: "All fields are required", variant: "destructive" });
      return;
    }

    const dateTime = new Date(`${dropInDate}T${dropInTime}`);
    if (dateTime <= new Date()) {
      toast({ title: "Invalid time", description: "Drop-in time must be in the future", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        spot_name: spotName.trim(),
        spot_location: spotLocation.trim() || undefined,
        topic: topic.trim(),
        fuel_type: fuelType.trim(),
        drop_in_time: dateTime.toISOString(),
      });
      toast({ title: "Circle created!", description: "Your Wroob Circle is now live." });
      onClose();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Create Community</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-sm">
            <MapPin className="h-3.5 w-3.5 text-primary" /> Spot Name *
          </Label>
          <Input
            placeholder="e.g. A-Block Hotspot, Bennett University"
            value={spotName}
            onChange={(e) => setSpotName(e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-sm">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Spot Location
          </Label>
          <Input
            placeholder="e.g. A-Block · GF"
            value={spotLocation}
            onChange={(e) => setSpotLocation(e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-sm">
            <Lightbulb className="h-3.5 w-3.5 text-warning" /> Topic on the Table *
          </Label>
          <Input
            placeholder="e.g. The AI Surge / Your Next Big Startup Move"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-sm">
            <Coffee className="h-3.5 w-3.5 text-amber-600" /> Fuel of the Session *
          </Label>
          <Input
            placeholder="e.g. Chai Gang or Black Coffee Crew"
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm">
              <Clock className="h-3.5 w-3.5 text-primary" /> Date *
            </Label>
            <Input
              type="date"
              value={dropInDate}
              onChange={(e) => setDropInDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm">
              <Clock className="h-3.5 w-3.5 text-primary" /> Time *
            </Label>
            <Input
              type="time"
              value={dropInTime}
              onChange={(e) => setDropInTime(e.target.value)}
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full brand-gradient border-0 text-white"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Post
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreateCircleForm;
