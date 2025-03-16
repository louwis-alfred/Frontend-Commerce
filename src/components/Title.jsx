import PropTypes from "prop-types";

const Title = ({ text1, text2 }) => {
  return (
    <div className="inline-flex gap-2 items-center mb-3">
      <p className="text-green-600">
        {text1} <span className="text-green-800 font-medium">{text2}</span>
      </p>
      
    </div>
  );
};

Title.propTypes = {
  text1: PropTypes.string.isRequired,
  text2: PropTypes.string.isRequired
}

export default Title;