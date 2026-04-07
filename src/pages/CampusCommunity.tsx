import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import Footer from "@/components/Footer";
import LocalCommunityGroups from "@/components/LocalCommunityGroups";
import { usePeerUpCircles, PeerUpCircle } from "@/hooks/usePeerUpCircles";
import CircleBubbles from "@/components/peerup/CircleBubbles";

import CircleDetailModal from "@/components/peerup/CircleDetailModal";
import CreateCircleForm from "@/components/peerup/CreateCircleForm";
import { Card, CardContent } from "@/components/ui/card";

const CampusCommunity = () => {
  const { user } = useAuth();
  const {
    circles, loading, createCircle, requestToJoin,
    fetchRequests, handleRequest, approveAll,
    fetchParticipants, deleteCircle, refresh,
  } = usePeerUpCircles();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<PeerUpCircle | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl py-8 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">PeerUp</h1>
          <p className="text-muted-foreground mt-1">
            Communities & groups vanish after 24 hours. No traces, just vibes.
          </p>
        </div>

        <Tabs defaultValue="campus" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="campus">Create Community</TabsTrigger>
            <TabsTrigger value="groups">Community Groups</TabsTrigger>
          </TabsList>

          {/* Campus Feed Tab — Wroob Circles */}
          <TabsContent value="campus" className="space-y-6 mt-6">
            {/* Create Form */}
            {showCreateForm && (
              <CreateCircleForm
                onSubmit={createCircle}
                onClose={() => setShowCreateForm(false)}
              />
            )}

            {/* Section Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Wroob Circles
              </h2>
              <Button variant="ghost" size="sm" onClick={refresh} className="gap-1 text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>
            </div>

            {/* Circle Bubbles Row */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : circles.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                  <h3 className="font-medium mb-1">No active circles</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Be the first to create a Wroob Circle and spark a conversation!
                  </p>
                  <Button onClick={() => setShowCreateForm(true)} className="brand-gradient border-0 text-white">
                    Create Community
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <CircleBubbles
                circles={circles}
                onSelect={(c) => setSelectedCircle(c)}
                onCreateNew={() => setShowCreateForm(true)}
              />
            )}

            {/* Detail Modal */}
            <CircleDetailModal
              circle={selectedCircle}
              open={!!selectedCircle}
              onClose={() => setSelectedCircle(null)}
              onRequestJoin={requestToJoin}
              onFetchRequests={fetchRequests}
              onHandleRequest={handleRequest}
              onApproveAll={approveAll}
              onFetchParticipants={fetchParticipants}
              onDelete={deleteCircle}
            />
          </TabsContent>

          {/* Local Groups Tab */}
          <TabsContent value="groups" className="mt-6">
            <LocalCommunityGroups />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default CampusCommunity;
