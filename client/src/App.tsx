import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Pages
import MainMenu from "./pages/MainMenu";
import Game from "./pages/Game";
import Leaderboard from "./pages/Leaderboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={MainMenu} />
      <Route path="/game" component={Game} />
      <Route path="/leaderboard" component={Leaderboard} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
