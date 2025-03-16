const IframeComponent = ({ url }) => {
  return (
    <div
      style={{
        width: "90vw",
        height: "50vw",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <iframe
        src={"https://chattingsystem-client.vercel.app"}
        width="100%"
        height="100%"
        style={{ border: "none" }}
        title="Embedded Content"
      ></iframe>
    </div>
  );
};

export default IframeComponent;
