import TextParticles from "@/components/text-particles";

export default function Home() {
  return (
    <div className="w-full h-screen overflow-hidden">
      <TextParticles 
        text={["Hey CEO", "It's your CTO"]} 
        scatteredColor={["#00DCFF", "#FF9900"]} 
        fontSize={210}
        lineHeight={1.5}
      />
    </div>
  );
}
