const HeroSection = () => {
  return (
    <section className="text-center py-20">
      <h1 className="text-5xl font-bold">The Future of Pool is Here</h1>
      <p className="text-xl mt-4">
        Experience the ultimate fusion of real-life pool and digital gaming.
      </p>
      <div className="mt-8">
        <button className="bg-blue-500 text-white px-8 py-3 rounded-full font-bold mr-4">
          Download for iOS
        </button>
        <button className="bg-green-500 text-white px-8 py-3 rounded-full font-bold">
          Download for Android
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
