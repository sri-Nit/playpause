import React from 'react';

const UploadVideo = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Upload Your Video</h1>
      <div className="max-w-2xl mx-auto bg-card p-8 rounded-lg shadow-md">
        <p className="text-muted-foreground text-center">
          This is where the video upload form will go.
        </p>
        {/* Placeholder for upload form */}
        <div className="mt-8 p-4 border border-dashed border-muted-foreground rounded-md text-center text-muted-foreground">
          Drag and drop your video here, or click to select a file.
        </div>
      </div>
    </div>
  );
};

export default UploadVideo;