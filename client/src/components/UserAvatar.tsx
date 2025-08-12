import { capitalizeWords } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface UserAvatarProps {
  username: string;
  size?: "small" | "medium";
}

const UserAvatar = ({ username, size = "medium" }: UserAvatarProps) => {
  const { user } = useAuth();
  
  const avatarSizes = {
    small: "w-8 h-8",
    medium: "w-12 h-12"
  };

  const textSizes = {
    small: "text-sm",
    medium: "text-base"
  };

  const companyName = user?.company?.name || user?.company_name || 'Sua Empresa';

  return (
    <div className="flex items-center gap-3">
      <div className={`${avatarSizes[size]} rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 modern-card-hover`}>
        <img 
          src="/avatar.png" 
          alt={`Avatar de ${username}`} 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback para quando a imagem não carregar
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.parentElement!.innerHTML = `
              <div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                ${username.charAt(0).toUpperCase()}
              </div>
            `;
          }}
        />
      </div>
      <div className="flex flex-col">
        <span className={`${textSizes[size]} font-semibold text-white`}>
          {capitalizeWords(username)}
        </span>
        <span className="text-xs text-blue-200">
          {user?.email || 'usuario@email.com'}
        </span>
        <div className="flex items-center gap-2 text-xs mt-1">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-green-400">Online</span>
          </div>
          <span className="text-blue-200">•</span>
          <span className="text-blue-200">{companyName}</span>
        </div>
      </div>
    </div>
  );
};

export default UserAvatar;