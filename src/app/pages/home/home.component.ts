import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { DataApiService } from './../../services/http/data-api.service';
import { Subject } from 'rxjs';
import { takeUntil, first } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  // Données
  
navSections = [
  { id: 'hero', label: 'Accueil' },
  { id: 'skills', label: 'Compétences' },
  { id: 'experience', label: 'Expérience' },
  { id: 'projects', label: 'Projets' },
  { id: 'education', label: 'Formation' },
  { id: 'contact', label: 'Contact' }
];

activeSection = 'hero';
isScrolled = false;
  skills: any = { top_skills: [] };
  featuredProjects: any = { projects: [] };
  workExperience: any = { work: [] };
  profile: any = {
    name: '',
    bio: '',
    avatar: '',
    location: '',
    socials: [],
    education: [],
    about: '',
    email: '',
    phone: ''
  };

  // États UI
  showMobileImages = false;
  isLoading = true;
  isResumeDownloading = false;
  
  // Gestion des souscriptions
  private destroy$ = new Subject<void>();

  constructor(
    public dataApi: DataApiService,
    private cdr: ChangeDetectorRef
  ) { }

  @HostListener('window:resize', ['$event'])
  onresize(event:any): void {
    this.checkWindowSize();
  }

  private checkWindowSize(): void {
    this.showMobileImages = window.innerWidth <= 768;
  }

  async ngOnInit(): Promise<void> {
      this.setupScrollListener();
    this.checkWindowSize();
    await this.loadPortfolioData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadPortfolioData(): Promise<void> {
    try {
      this.isLoading = true;
      
      console.log('Début du chargement des données...');
      
      // Charger toutes les données en parallèle
      const [profileData, skillsData, projectsData, experienceData] = await Promise.all([
        this.dataApi.getProfile(),
        this.dataApi.getTopSkills(),
        this.dataApi.getFeaturedProjects(),
        this.dataApi.getWorkHistory()
      ]);

      // Assigner les données
      this.profile = profileData || this.getDefaultProfile();
      this.skills = skillsData || { top_skills: [] };
      this.featuredProjects = projectsData || { projects: [] };
      this.workExperience = experienceData || { work: [] };

      console.log('Profil chargé:', this.profile);
      console.log('Compétences chargées:', this.skills);
      console.log('Projets chargés:', this.featuredProjects);
      console.log('Expérience chargée:', this.workExperience);
      
      this.cdr.detectChanges();
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      this.setDefaultData();
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private getDefaultProfile(): any {
    return {
      name: 'HAMMADACHE Hakim',
      bio: 'Organisé, sérieux, aventureux, sociable, sens de responsabilité et esprit de groupe',
      avatar: 'assets/image/pic.JPG',
      location: 'Alger, Algérie',
      email: 'hammadachehakim1@gmail.com',
      phone: '055457143',
      socials: [],
      education: [],
      about: ''
    };
  }

  private setDefaultData(): void {
    console.log('Chargement des données par défaut...');
    
    this.skills = {
      top_skills: ['Angular', 'TypeScript', 'NestJs', 'NodeJS', 'JavaScript']
    };
    
    this.featuredProjects = {
      projects: [
        {
          preview: 'assets/media/projects/bib.png',
          created_at: '2018',
          name: 'Application web gestion de bibliothèque',
          description: 'Développé avec HTML CSS JS PHP MYSQL'
        }
      ]
    };
    
    this.workExperience = {
      work: [
        {
          date: 'Mai 2023 - present',
          title: 'Administrateur Base de données à OURQUILANE',
          description: 'Administrateur Base de données et développeur',
          stack: ['Angular', 'NestJs', 'Postgresql', 'MongoDB']
        }
      ]
    };
    
    this.profile = this.getDefaultProfile();
  }

  async downloadResume(): Promise<void> {
    if (this.isResumeDownloading) return;
    
    this.isResumeDownloading = true;
    this.cdr.detectChanges();
    
    try {
      console.log('Téléchargement du CV...');
      const resumeData = await this.dataApi.getBase64CV()
        .pipe(takeUntil(this.destroy$), first())
        .toPromise();
      
      if (resumeData) {
        this.openPdf(resumeData);
      } else {
        throw new Error('Aucune donnée de CV reçue');
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement du CV:', error);
      alert('Impossible de télécharger le CV. Veuillez réessayer.');
    } finally {
      this.isResumeDownloading = false;
      this.cdr.detectChanges();
    }
  }

  private openPdf(data: Blob): void {
    try {
      const url = window.URL.createObjectURL(data);
      const newTab = window.open(url, '_blank');
      
      if (!newTab || newTab.closed || typeof newTab.closed == 'undefined') {
        // Fallback pour les bloqueurs de popup
        const link = document.createElement('a');
        link.href = url;
        link.download = 'CV_HAMMADACHE_Hakim.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      // Nettoyage
      setTimeout(() => {
        if (url) {
          window.URL.revokeObjectURL(url);
        }
      }, 1000);
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du PDF:', error);
      alert('Erreur lors de l\'ouverture du PDF');
    }
  }

  // Méthodes utilitaires pour le template
  
  scrollToSection(sectionId: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  getSkillClass(index: number): string {
    const classes = ['skill-primary', 'skill-secondary', 'skill-accent'];
    return classes[index % 3];
  }

  getAnimationDelay(index: number): string {
    return `${index * 0.1}s`;
  }

  isEven(index: number): boolean {
    return index % 2 === 0;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return dateString;
  }

  getProjectCategory(project: any): string {
    if (project && project.name) {
      // Retourne la première technologie mentionnée dans le nom
      const techs = ['Angular', 'Laravel', 'PHP', 'NestJs', 'TypeScript', 'JavaScript', 'Bootstrap', 'TailwindCSS'];
      for (const tech of techs) {
        if (project.name.includes(tech) || (project.description && project.description.includes(tech))) {
          return tech;
        }
      }
    }
    return 'web';
  }

  openProjectLink(link: string | undefined): void {
    if (link) {
      window.open(link, '_blank');
    }
  }

  handleImageError(event: Event, type: 'avatar' | 'project' = 'avatar'): void {
    const element = event.target as HTMLImageElement | HTMLDivElement;
    
    if (type === 'avatar') {
      if (element instanceof HTMLImageElement) {
        element.src = 'assets/image/pic.JPG';
        console.log('Erreur image avatar, placeholder chargé');
      }
    } else {
      if (element instanceof HTMLDivElement) {
        element.style.backgroundImage = 'url(assets/media/project-placeholder.jpg)';
        console.log('Erreur image projet, placeholder chargé');
      }
    }
  }

  getProjectImage(project: any): string {
    if (project && project.preview) {
      return `url(${project.preview})`;
    }
    return 'url(assets/media/project-placeholder.jpg)';
  }

  hasProjectLink(project: any): boolean {
    return !!(project && project.link);
  }

  // Méthodes pour vérifier si les données existent
  hasSkills(): boolean {
    return !!(this.skills && this.skills.top_skills && this.skills.top_skills.length > 0);
  }

  hasProjects(): boolean {
    return !!(this.featuredProjects && this.featuredProjects.projects && this.featuredProjects.projects.length > 0);
  }

  hasExperience(): boolean {
    return !!(this.workExperience && this.workExperience.work && this.workExperience.work.length > 0);
  }

  hasProfile(): boolean {
    return !!(this.profile && this.profile.name);
  }

  hasSocials(): boolean {
    return !!(this.profile && this.profile.socials && this.profile.socials.length > 0);
  }

  hasEducation(): boolean {
    return !!(this.profile && this.profile.education && this.profile.education.length > 0);
  }

  getBio(): string {
    return this.profile?.about || this.profile?.bio || '';
  }

  getEmail(): string {
    return this.profile?.email || '';
  }

  getPhone(): string {
    return this.profile?.phone || '';
  }

  getLocation(): string {
    return this.profile?.location || '';
  }

  // Méthode pour formater la description avec des sauts de ligne
  formatDescription(description: string): string {
    if (!description) return '';
    return description.replace(/\n/g, '<br>');
  }
  
setupScrollListener() {
  window.addEventListener('scroll', () => {
    this.isScrolled = window.scrollY > 50;
    this.updateActiveSection();
  });
}

updateActiveSection() {
  const sections = this.navSections.map(s => s.id);
  for (const sectionId of sections.reverse()) {
    const element = document.getElementById(sectionId);
    if (element) {
      const rect = element.getBoundingClientRect();
      if (rect.top <= window.innerHeight / 3) {
        this.activeSection = sectionId;
        break;
      }
    }
  }
}

getSkillLevel(index: number): number {
  // Niveaux dégressifs pour l'effet visuel
  const levels = [95, 90, 88, 85, 82, 80, 78, 75, 72, 70, 68, 65, 62, 60];
  return levels[index] || 60;
}

getLanguageColor(language: string): string {
  const colors: { [key: string]: string } = {
    'TypeScript': '#3178c6',
    'JavaScript': '#f7df1e',
    'Python': '#3776ab',
    'Java': '#ed8b00',
    'C#': '#239120',
    'PHP': '#777bb4',
    'HTML': '#e34c26',
    'CSS': '#1572b6',
    'SCSS': '#cc6699',
    'SQL': '#336791',
    'Dart': '#0175c2',
    'Kotlin': '#7f52ff',
    'Swift': '#fa7343',
    'Go': '#00add8',
    'Rust': '#dea584',
    'Ruby': '#cc342d',
    'Vue': '#42b883',
    'React': '#61dafb'
  };
  return colors[language] || '#64748b';
}
}