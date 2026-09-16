import React, { useEffect, useRef, useState } from 'react';
import { Truck, Leaf, ShieldCheck, Clock, Award, Heart, Sparkles, Zap } from 'lucide-react';
import './FeaturesSection.css';

const defaultFeatures = [
	{
		id: 1,
		icon: Leaf,
		title: '100% Organic',
		description:
			'Certified organic produce sourced directly from sustainable local farms.',
		color: '#2ecc71',
	},
	{
		id: 2,
		icon: Truck,
		title: 'Fast Delivery',
		description:
			'Same-day delivery for orders placed before 2 PM. Freshness guaranteed.',
		color: '#3498db',
	},
	{
		id: 3,
		icon: ShieldCheck,
		title: 'Quality Check',
		description:
			'Every item is hand-picked and quality checked before it reaches your door.',
		color: '#9b59b6',
	},
	{
		id: 4,
		icon: Clock,
		title: '24/7 Support',
		description:
			'Our dedicated support team is always here to help you with your needs.',
		color: '#e67e22',
	},
];

const getIconComponent = (iconName, fallback = Leaf) => {
	if (!iconName) return fallback;
	if (typeof iconName !== 'string') return iconName;
	switch (iconName.toLowerCase()) {
		case 'leaf': return Leaf;
		case 'truck': return Truck;
		case 'shieldcheck':
		case 'shield': return ShieldCheck;
		case 'clock': return Clock;
		case 'award': return Award;
		case 'heart': return Heart;
		case 'sparkles': return Sparkles;
		case 'zap': return Zap;
		default: return Leaf;
	}
};

const FeaturesSection = ({ data }) => {
	const sectionRef = useRef(null);
	const [isVisible, setIsVisible] = useState(false);

	const pillText = data?.pillText || 'Key Benefits';
	const title = data?.title || 'Why Choose Us';

	const displayFeatures = React.useMemo(() => {
		if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
			return data.items.map((item, index) => ({
				id: item._id || item.id || index + 1,
				icon: getIconComponent(item.icon, defaultFeatures[index % defaultFeatures.length]?.icon),
				title: item.title || defaultFeatures[index % defaultFeatures.length]?.title,
				description: item.description || defaultFeatures[index % defaultFeatures.length]?.description,
				color: item.color || defaultFeatures[index % defaultFeatures.length]?.color || '#2ecc71',
			}));
		}
		return defaultFeatures;
	}, [data]);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.1 }
		);

		if (sectionRef.current) {
			observer.observe(sectionRef.current);
		}

		return () => {
			if (sectionRef.current) {
				observer.disconnect();
			}
		};
	}, []);

	return (
		<div className="section-features" ref={sectionRef}>
			<div className="container">
				<div className="features-header">
					<span
						className="features-keyword-pill"
						style={{
							display: 'block',
							margin: '0 auto 1rem auto',
						}}
					>
						{pillText}
					</span>
					<span
						className="features-title"
						style={{ display: 'block' }}
					>
						{title}
					</span>
				</div>
				<div className={`features-grid ${isVisible ? 'animate' : ''}`}>
					{displayFeatures.map((feature, index) => {
						const IconComponent = feature.icon;
						return (
							<div
								key={feature.id}
								className="feature-card"
								style={{ transitionDelay: `${index * 100}ms` }}
							>
								<div
									className="feature-icon-wrapper"
									style={{
										background: `${feature.color}20`,
										color: feature.color,
										boxShadow: `0 10px 20px -10px ${feature.color}60`,
									}}
								>
									<IconComponent size={32} />
								</div>
								<h3 className="feature-title">{feature.title}</h3>
								<p className="feature-desc">{feature.description}</p>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default FeaturesSection;
