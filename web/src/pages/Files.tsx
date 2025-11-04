import { useState, useEffect } from 'react';
import { BucketList } from '@/components/BucketList';
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';
import { agentManagementService, Agent } from '@/services/agentManagementService';
import { Cloud } from 'lucide-react';
import { showToast } from '@/lib/toast';

export function Files() {
  const [buckets, setBuckets] = useState<Map<string, Agent[]>>(new Map());
  const [loading, setLoading] = useState(true);

  const loadBuckets = async () => {
    try {
      setLoading(true);
      const allAgents = await agentManagementService.listAgents(true);
      
      // Build bucket map from s3_sources
      const bucketMap = new Map<string, Agent[]>();
      for (const agent of allAgents) {
        if (agent.s3_sources) {
          for (const source of agent.s3_sources) {
            if (!bucketMap.has(source.bucket_name)) {
              bucketMap.set(source.bucket_name, []);
            }
            bucketMap.get(source.bucket_name)!.push(agent);
          }
        }
      }
      
      setBuckets(bucketMap);
    } catch (error) {
      console.error('Error loading buckets:', error);
      showToast.error('Failed to load S3 buckets. Please check your configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuckets();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="File Management" icon={Cloud} currentPage="files" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              S3 Buckets
            </h2>
            <p className="text-gray-600">
              Manage files in the S3 buckets. Each bucket is associated with one or more AI agents.
            </p>
          </section>

          {/* Buckets Section */}
          <section>
            <BucketList buckets={buckets} loading={loading} />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}