import UploadSection from "../UploadSection";

export default function UploadSectionExample() {
  const handleFileUpload = (file: File) => {
    console.log("File uploaded:", file.name);
  };

  const handleLoadDemo = () => {
    console.log("Load demo data");
  };

  return (
    <UploadSection onFileUpload={handleFileUpload} onLoadDemo={handleLoadDemo} />
  );
}
