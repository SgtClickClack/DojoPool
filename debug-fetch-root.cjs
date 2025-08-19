const url = 'http://localhost:3000/';

(async () => {
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log('STATUS:', res.status);
    console.log('HEADERS:', Object.fromEntries(res.headers.entries()));
    console.log('BODY START:\n');
    console.log(text.slice(0, 2000));
  } catch (e) {
    console.error('Error fetching root:', e);
  }
})();
