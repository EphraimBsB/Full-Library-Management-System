import { DataSource, In } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { MembershipRequest, MembershipRequestStatus } from '../../../membership/entities/membership-request.entity';
import { User } from '../../../users/entities/user.entity';
import { MembershipType } from '../../../sys-configs/membership-types/entities/membership-type.entity';
import { faker } from '@faker-js/faker';

// Helper function to generate random document paths
const generateDocumentPath = (): string => {
  const docTypes = ['id', 'passport', 'student_id', 'employee_id', 'recommendation'];
  const ext = faker.helpers.arrayElement(['pdf', 'jpg', 'png']);
  return `/uploads/documents/${faker.string.uuid()}_${faker.helpers.arrayElement(docTypes)}.${ext}`;
};

// Helper function to generate random notes
const generateRequestNotes = (user: User, type: string): string => {
  const notes = [
    `Requesting ${type} membership for academic purposes.`,
    `Need ${type} membership for research work.`,
    `Upgrading to ${type} membership as per new requirements.`,
    `Requesting ${type} membership for project work.`,
    `Need extended borrowing privileges with ${type} membership.`,
    `Applying for ${type} membership as per faculty recommendation.`,
    `Requesting ${type} membership for thesis work.`,
    `Need access to additional resources with ${type} membership.`
  ];
  return faker.helpers.arrayElement(notes);
};

export class MembershipRequestsSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding membership requests...');
    const requestRepository = dataSource.getRepository(MembershipRequest);
    const userRepository = dataSource.getRepository(User);
    const membershipTypeRepository = dataSource.getRepository(MembershipType);

    // Get required data with proper error handling
    let users: User[] = [];
    let membershipTypes: MembershipType[] = [];
    let adminUsers: User[] = [];

    try {
      [users, membershipTypes, adminUsers] = await Promise.all([
        // Get users who can request memberships (students and faculty)
        userRepository.find({
          relations: ['role'],
          where: {
            role: { 
              name: In(['Student', 'Faculty', 'Researcher']) 
            },
            isActive: true
          },
          take: 30 // Get more users for variety
        }),
        // Get all active membership types
        membershipTypeRepository.find({ where: { isActive: true } }),
        // Get admin/librarian users for processing requests
        userRepository.find({
          relations: ['role'],
          where: [
            { role: { name: 'Admin' } },
            { role: { name: 'Librarian' } }
          ],
          take: 5
        })
      ]);
    } catch (error) {
      console.error('Error fetching data for membership requests:', error);
      return { entity: 'MembershipRequest', count: 0, error: 'Failed to fetch required data' };
    }

    if (users.length === 0 || membershipTypes.length === 0) {
      const errorMsg = 'Skipping membership requests seeding: No active users or membership types found';
      console.warn(errorMsg);
      return { entity: 'MembershipRequest', count: 0, error: errorMsg };
    }

    if (adminUsers.length === 0) {
      console.warn('No admin/librarian users found for processing requests');
    }

    const requests: MembershipRequest[] = [];
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    // Create membership requests for a subset of users
    const usersToProcess = users.slice(0, Math.min(users.length, 50)); // Max 50 users
    
    for (const [index, user] of usersToProcess.entries()) {
      try {
        // Skip some users to have a mix of users with and without requests
        if (faker.datatype.boolean(0.2)) continue; // 20% chance to skip

        // For variety, assign different membership types based on user role
        let eligibleTypes = [...membershipTypes];
        
        // Filter types based on user role if needed
        if (user.role?.name === 'Student') {
          eligibleTypes = membershipTypes.filter(t => 
            !['Faculty', 'Researcher'].includes(t.name)
          );
        } else if (user.role?.name === 'Faculty') {
          eligibleTypes = membershipTypes.filter(t => 
            !['Student', 'Alumni'].includes(t.name)
          );
        }

        if (eligibleTypes.length === 0) continue;

        const membershipType = faker.helpers.arrayElement(eligibleTypes);
        
        // Random request date within the last 3 months
        const requestDate = faker.date.between({ 
          from: threeMonthsAgo, 
          to: now 
        });

        // Determine request status with weighted probabilities
        const status = this.getWeightedStatus(index);
        const isProcessed = status !== MembershipRequestStatus.PENDING;
        const processedBy = isProcessed && adminUsers.length > 0 
          ? faker.helpers.arrayElement(adminUsers) 
          : null;
        
        // Generate documents for the request
        const documentCount = faker.number.int({ min: 1, max: 3 });
        const documents = Array.from({ length: documentCount }, () => ({
          name: `document_${faker.string.uuid().substring(0, 8)}`,
          path: generateDocumentPath(),
          uploadedAt: requestDate,
          type: faker.helpers.arrayElement(['id', 'proof_of_address', 'recommendation', 'other'])
        }));

        // Create a new request
        const request = new MembershipRequest();
        request.user = user;
        request.userId = user.id;
        request.membershipType = membershipType;
        request.membershipTypeId = membershipType.id;
        request.status = status;
        request.notes = generateRequestNotes(user, membershipType.name);
        request.createdAt = requestDate;
        request.updatedAt = requestDate;

        // If request is approved or rejected, set processed by and processed at
        if (isProcessed && processedBy) {
          request.processedBy = processedBy;
          request.processedById = processedBy.id;
          request.processedAt = new Date(
            requestDate.getTime() + 
            faker.number.int({ min: 1, max: 7 }) * 24 * 60 * 60 * 1000 // 1-7 days later
          );
          
          if (status === MembershipRequestStatus.REJECTED) {
            request.rejectionReason = this.getRandomRejectionReason();
          } else if (status === MembershipRequestStatus.APPROVED) {
            request.createdAt = new Date(request.processedAt);
            request.updatedAt = new Date(request.processedAt);
          }
        }

        requests.push(request);
      } catch (error) {
        console.error(`Error creating membership request for user ${user.id}:`, error);
      }
    }

    // Process requests in batches
    const BATCH_SIZE = 20;
    let created = 0;
    const results = {
      total: requests.length,
      created: 0,
      skipped: 0,
      byStatus: {
        [MembershipRequestStatus.PENDING]: 0,
        [MembershipRequestStatus.APPROVED]: 0,
        [MembershipRequestStatus.REJECTED]: 0,
      }
    };

    for (let i = 0; i < requests.length; i += BATCH_SIZE) {
      const batch = requests.slice(i, i + BATCH_SIZE);
      
      try {
        const savedRequests = await requestRepository.save(batch);
        created += savedRequests.length;
        
        // Update statistics
        savedRequests.forEach(req => {
          results.byStatus[req.status] = (results.byStatus[req.status] || 0) + 1;
        });
        
        // Add a small delay between batches
        if (i + BATCH_SIZE < requests.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Error saving batch starting at index ${i}:`, error);
        // Try saving individually to identify problematic records
        for (const req of batch) {
          try {
            const saved = await requestRepository.save(req);
            created++;
            results.byStatus[saved.status] = (results.byStatus[saved.status] || 0) + 1;
          } catch (individualError) {
            results.skipped++;
            console.error(`Failed to save request for user ${req.userId}:`, individualError);
          }
        }
      }
    }

    results.created = created;
    results.skipped = requests.length - created;

    // Log summary
    console.log('\n=== Membership Requests Seeding Summary ===');
    console.log(`Total requests processed: ${results.total}`);
    console.log(`Successfully created: ${results.created}`);
    console.log(`Skipped/Failed: ${results.skipped}`);
    console.log('\nBy status:');
    Object.entries(results.byStatus).forEach(([status, count]) => {
      console.log(`- ${status}: ${count}`);
    });

    return {
      entity: 'MembershipRequest',
      count: created,
      details: results
    };
  }

  private getWeightedStatus(index: number): MembershipRequestStatus {
    // Weighted random status with higher probability for approved requests
    const weights = {
      [MembershipRequestStatus.PENDING]: 0.2,    // 20% chance
      [MembershipRequestStatus.APPROVED]: 0.6,   // 60% chance
      [MembershipRequestStatus.REJECTED]: 0.15,  // 15% chance
    };

    const random = Math.random();
    let sum = 0;
    
    for (const [status, weight] of Object.entries(weights)) {
      sum += weight;
      if (random <= sum) {
        return status as MembershipRequestStatus;
      }
    }
    
    // Default to pending if something goes wrong
    return MembershipRequestStatus.PENDING;
  }

  private getRandomRejectionReason(): string {
    const reasons = [
      'Incomplete application form',
      'Missing required identification documents',
      'Does not meet minimum eligibility criteria',
      'Maximum membership limit already reached',
      'Previous membership was revoked due to policy violations',
      'Insufficient proof of address or identity',
      'Application contains inconsistent information',
      'Membership type not available for the requested user category',
      'Duplicate application detected',
      'Required recommendation letter not provided',
      'Application submitted after the deadline',
      'Incomplete payment of membership fees',
      'User has outstanding fines from previous membership',
      'Requested membership type is currently not available',
      'User account is not in good standing'
    ];
    return faker.helpers.arrayElement(reasons);
  }

  private getRejectionReasonDetails(reason: string): string {
    const details: Record<string, string> = {
      'Incomplete application form': 'Please complete all required fields in the application form and resubmit.',
      'Missing required identification documents': 'Please provide a valid government-issued ID and proof of address.',
      'Does not meet minimum eligibility criteria': 'Your application does not meet the minimum requirements for this membership type.',
      'Maximum membership limit already reached': 'The maximum number of memberships for this category has been reached.',
      'Previous membership was revoked due to policy violations': 'Your previous membership was terminated due to violations of library policies.',
      'Insufficient proof of address or identity': 'The provided documents do not sufficiently verify your identity or address.',
      'Application contains inconsistent information': 'There are inconsistencies in the information provided. Please review and correct your application.',
      'Membership type not available for the requested user category': 'The selected membership type is not available for your user category.',
      'Duplicate application detected': 'We found another application from you that is currently being processed.',
      'Required recommendation letter not provided': 'A recommendation letter from a faculty member is required for this membership type.',
      'Application submitted after the deadline': 'The application was received after the submission deadline.',
      'Incomplete payment of membership fees': 'The required membership fee has not been paid in full.',
      'User has outstanding fines from previous membership': 'Please clear all outstanding fines before applying for a new membership.',
      'Requested membership type is currently not available': 'The requested membership type is temporarily unavailable. Please check back later.',
      'User account is not in good standing': 'Your account has been flagged due to previous policy violations.'
    };
    
    return details[reason] || 'Your application could not be processed at this time. Please contact support for more information.';
  }
}
