const features = [
  {
    title: 'Social Feed',
    description:
      'See a live feed of player activities, including match wins and tournament victories.',
  },
  {
    title: 'Territory Wars',
    description:
      'Claim your local pool hall and defend it from challengers in real-life matches.',
  },
  {
    title: 'Real-Life Matches',
    description:
      'Challenge other players to real-life pool matches and have the results tracked in the app.',
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20">
      <h2 className="text-3xl font-bold text-center">Key Features</h2>
      <div className="mt-12 grid md:grid-cols-3 gap-8">
        {features.map((feature) => (
          <div key={feature.title} className="bg-gray-100 p-8 rounded-lg">
            <h3 className="text-xl font-bold">{feature.title}</h3>
            <p className="mt-2">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
