const emitResult = ({ statusCode, success, message, data }) => {
  // কেন এই পরিবর্তন: ডাটা না থাকলেও যেন একটি কনসিস্টেন্ট অবজেক্ট রিটার্ন করে
  return {
    statusCode: statusCode || 200,
    success: success ?? true,
    message: message || "Success",
    ...(data !== undefined && { data }), // ডেটা থাকলে তবেই ফিল্ডটি এড হবে
  };
};

export default emitResult;