import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

interface ScrollDownButtonProps {
  onClick: () => void;
}

export const ScrollDownButton: React.FC<ScrollDownButtonProps> = ({
  onClick,
}) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="absolute bottom-8 right-8 z-10 bg-blue-500 text-white rounded-full p-2 shadow-md border border-blue-600 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label="Scroll to bottom"
    >
      <ArrowDown className="h-5 w-5" />
    </motion.button>
  );
};
