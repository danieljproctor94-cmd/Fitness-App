import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { navItems } from '@/lib/navigation';
import { Plus, ListTodo, Weight, Dumbbell, Home } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function BottomNav() {
    const location = useLocation();

    return (
        <div className='md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-white/5'>
            <div className='flex flex-col w-full pb-[env(safe-area-inset-bottom)]'>
                
                <nav className='flex items-center justify-around h-16 px-2'>
                    {/* 1. Home */}
                    <NavIcon href='/dashboard' label='Home' active={location.pathname === '/dashboard'} />

                    {/* 2. Workouts */}
                    <NavIcon href='/workouts' label='Workouts' active={location.pathname.startsWith('/workouts')} />

                    {/* 3. Middle Action Button (Plus) */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className='relative -top-5'>
                                <button
                                    className='h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 focus:outline-none'
                                >
                                    <Plus className='h-8 w-8' />
                                </button>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side='top' align='center' className='mb-6 w-72 p-2 flex flex-col gap-2 rounded-2xl border-white/10 shadow-2xl bg-background/95 backdrop-blur-xl'>
                            <DropdownMenuItem asChild>
                                <Link to='/planner' className='flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 focus:bg-white/5 cursor-pointer w-full transition-colors outline-none h-auto'>
                                    <div className='h-12 w-12 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/20'>
                                        <ListTodo className='h-6 w-6 text-violet-400' />
                                    </div>
                                    <div className='flex flex-col gap-0.5'>
                                        <span className='font-bold text-base text-foreground'>New Task</span>
                                        <span className='text-xs text-muted-foreground'>Create a to-do or reminder</span>
                                    </div>
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Link to='/workouts' className='flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 focus:bg-white/5 cursor-pointer w-full transition-colors outline-none h-auto'>
                                    <div className='h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20'>
                                        <Dumbbell className='h-6 w-6 text-emerald-400' />
                                    </div>
                                    <div className='flex flex-col gap-0.5'>
                                        <span className='font-bold text-base text-foreground'>Log Workout</span>
                                        <span className='text-xs text-muted-foreground'>Track exercises & sets</span>
                                    </div>
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Link to='/measurements' className='flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 focus:bg-white/5 cursor-pointer w-full transition-colors outline-none h-auto'>
                                    <div className='h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20'>
                                        <Weight className='h-6 w-6 text-blue-400' />
                                    </div>
                                    <div className='flex flex-col gap-0.5'>
                                        <span className='font-bold text-base text-foreground'>Weigh In</span>
                                        <span className='text-xs text-muted-foreground'>Record body stats</span>
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* 4. Measurements */}
                    <NavIcon href='/measurements' label='Measurements' active={location.pathname.startsWith('/measurements')} />

                    {/* 5. Planner */}
                    <NavIcon href='/planner' label='Planner' active={location.pathname.startsWith('/planner')} />
                </nav>
            </div>
        </div>
    );
}

function NavIcon({ href, label, active }: { href: string; label: string; active: boolean }) {
    const item = navItems.find(i => i.label === label) || { icon: Home };
    const Icon = item.icon;

    return (
        <Link
            to={href}
            className={cn(
                'flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all flex-1 min-w-0 active:scale-95',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
        >
            <Icon className={cn(
                'h-6 w-6 mb-1',
                active && 'drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]'
            )} />
            <span className='text-[10px] font-bold uppercase tracking-tighter'>
                {label}
            </span>
        </Link>
    );
}







