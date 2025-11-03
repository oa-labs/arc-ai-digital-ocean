declare const __APP_VERSION__: string;

export function Footer() {
  return (
    <footer className="mt-12 py-6 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500">
          &copy; 2025 OpenArc, LLC. All rights reserved. | v{__APP_VERSION__}
        </p>
      </div>
    </footer>
  );
}