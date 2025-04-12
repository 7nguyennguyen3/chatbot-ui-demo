import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

interface ChatToggleButtonProps {
  onClick: () => void;
}

export const ChatToggleButton: React.FC<ChatToggleButtonProps> = ({
  onClick,
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="bg-blue-500 text-white rounded-full p-3 shadow-lg cursor-pointer fixed 
      bottom-8 right-8 z-[100] flex items-center justify-center"
      onClick={onClick}
      aria-label="Open chat"
    >
      <MessageCircle className="h-6 w-6" />
    </motion.button>
  );
};
