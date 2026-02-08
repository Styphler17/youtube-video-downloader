import VideoDownloader from "@/components/VideoDownloader";

const Embed = () => {
    return (
        <div className="w-full min-h-screen bg-transparent p-4">
            {/* 
        Container is transparent to blend with host site.
        We only render the VideoDownloader component.
      */}
            <div className="max-w-4xl mx-auto">
                <VideoDownloader />
            </div>
        </div>
    );
};

export default Embed;
