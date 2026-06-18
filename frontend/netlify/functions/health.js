exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "ok",
      service: "frontend",
      message: "AmmuFoods Frontend is running",
      timestamp: new Date().toISOString(),
    }),
  };
};
