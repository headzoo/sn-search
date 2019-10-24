<?php
namespace App\Form;

use App\Model\AdvancedModel;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\DateType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\FormEvent;
use Symfony\Component\Form\FormEvents;
use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * Class AdvancedType
 */
class AdvancedType extends AbstractType
{
    /**
     * {@inheritDoc}
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $flairChoices = [
            'Select...' => ''
        ];
        foreach($options['flairs'] as $flair) {
            $flairChoices[$flair] = str_replace(' ', '_', $flair);
        }

        $domainChoices = [
            'Select...' => ''
        ];
        foreach($options['domains'] as $domain) {
            $domainChoices[$domain] = $domain;
        }

        $builder
            ->add('term')
            ->add('author')
            ->add('startDate', DateType::class, [
                'required'   => false,
                'widget'     => 'single_text',
                'empty_data' => ''
            ])
            ->add('endDate', DateType::class, [
                'required'   => false,
                'widget'     => 'single_text',
                'empty_data' => ''
            ])
            ->add('flair', ChoiceType::class, [
                'required' => false,
                'choices'  => $flairChoices
            ])
            ->add('domain', ChoiceType::class, [
                'required' => false,
                'choices'  => $domainChoices
            ])
            ->add('type', ChoiceType::class, [
                'required' => false,
                'choices'  => [
                    'Submissions and comments' => 'sc',
                    'Submissions'              => 's',
                    'Comments'                 => 'c'
                ]
            ])
        ;

        $builder->addEventListener(FormEvents::PRE_SUBMIT, function(FormEvent $event) {
            $form = $event->getForm();
            $form->remove('flair');
            $form->remove('domain');
            $form->add('flair');
            $form->add('domain');
        });
    }

    /**
     * {@inheritDoc}
     */
    public function getBlockPrefix() {}

    /**
     * {@inheritDoc}
     */
    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults([
            'data_class' => AdvancedModel::class,
            'csrf_protection' => false,
            'flairs'     => [],
            'domains'    => []
        ]);
    }
}
