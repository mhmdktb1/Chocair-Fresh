import React from 'react';
import { Sparkles, PackageCheck, Truck, ShieldCheck, Leaf, Clock, Award, Heart, CheckCircle2, Zap } from 'lucide-react';
import './FeaturesSection.css';

const defaultOfferings = [
	{
		id: 1,
		icon: Sparkles,
		iconName: 'Sparkles',
		step: '01',
		badge: 'Fresh Daily',
		title: 'Carefully Selected',
		description: 'Fresh, quality produce hand-selected from farm harvests.',
	},
	{
		id: 2,
		icon: PackageCheck,
		iconName: 'PackageCheck',
		step: '02',
		badge: 'Inspected',
		title: 'Checked & Packed',
		description: 'Every item is inspected and neatly packed with care.',
	},
	{
		id: 3,
		icon: Truck,
		iconName: 'Truck',
		step: '03',
		badge: 'Speedy',
		title: 'Fast Delivery',
		description: 'Arrives quickly and chilled, ready for your kitchen table.',
	},
	{
		id: 4,
		icon: ShieldCheck,
		iconName: 'ShieldCheck',
		step: '04',
		badge: 'Guaranteed',
		title: 'Quality Guarantee',
		description: 'Not 100% satisfied? We will replace or refund right away.',
	},
];

const getIconComponent = (iconName, fallback = Sparkles) => {
	if (!iconName) return fallback;
	if (typeof iconName !== 'string') return iconName;
	switch (iconName.toLowerCase()) {
		case 'sparkles':
		case 'sparkle':
			return Sparkles;
		case 'packagecheck':
		case 'package':
		case 'packed':
		case 'box':
			return PackageCheck;
		case 'truck':
		case 'delivery':
			return Truck;
		case 'shieldcheck':
		case 'shield':
		case 'guarantee':
			return ShieldCheck;
		case 'checkcircle':
		case 'checkcircle2':
			return CheckCircle2;
		case 'leaf':
		case 'organic':
			return Leaf;
		case 'clock':
			return Clock;
		case 'award':
			return Award;
		case 'heart':
			return Heart;
		case 'zap':
			return Zap;
		default:
			return fallback;
	}
};

const FeaturesSection = ({ data }) => {
	const title = data?.title === 'Why Choose Us' || !data?.title ? 'What We Offer' : data.title;
	const pillText = data?.pillText || 'Our Promise';

	const items = React.useMemo(() => {
		if (data?.items && Array.isArray(data.items) && data.items.length === 4) {
			const isOldDefault = data.items.some(it => it.title === '100% Organic');
			if (!isOldDefault) {
				return data.items.map((item, index) => ({
					id: item._id || item.id || index + 1,
					step: `0${index + 1}`,
					badge: defaultOfferings[index]?.badge || 'Service',
					icon: getIconComponent(item.icon, defaultOfferings[index]?.icon || Sparkles),
					title: item.title || defaultOfferings[index]?.title,
					description: item.description || defaultOfferings[index]?.description,
				}));
			}
		}
		return defaultOfferings;
	}, [data]);

	return (
		<section className="section-offerings" aria-label="What We Offer">
			<div className="container">
				
				{/* Section Header */}
				<div className="offerings-header">
					<div className="offerings-pre-badge">
						<Sparkles size={14} />
						<span>{pillText}</span>
					</div>
					<h2 className="offerings-title">{title}</h2>
					<p className="offerings-subtitle">
						The highest quality standards from local soil directly to your doorstep.
					</p>
				</div>

				{/* Cards Grid */}
				<div className="offerings-grid">
					{items.map((item) => {
						const IconComponent = item.icon;
						return (
							<div key={item.id} className="offering-card">
								
								<div className="offering-card-top">
									<div className="offering-icon-wrapper" aria-hidden="true">
										<IconComponent size={22} strokeWidth={2} />
									</div>
									<span className="offering-step-pill">{item.badge}</span>
								</div>

								<div className="offering-card-body">
									<h3 className="offering-title">{item.title}</h3>
									<p className="offering-desc">{item.description}</p>
								</div>

							</div>
						);
					})}
				</div>

			</div>
		</section>
	);
};

export default FeaturesSection;
